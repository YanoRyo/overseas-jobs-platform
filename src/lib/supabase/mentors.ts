import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './client';
import type {
  MentorRow,
  MentorInsert,
  MentorLanguageInsert,
  MentorExpertiseInsert,
  MentorAvailabilityInsert,
} from './types';

// ========================================
// 取得系
// ========================================

export const fetchMentors = async () => {
  return await supabase
    .from('mentors')
    .select('*')
    .order('created_at', { ascending: false });
};

/**
 * 指定したユーザーがメンター登録済みかチェック
 */
export const checkMentorExistsByUserId = async (
  supabaseClient: SupabaseClient,
  userId: string
): Promise<boolean> => {
  const { data } = await supabaseClient
    .from('mentors')
    .select('id')
    .eq('user_id', userId)
    .single();
  return !!data;
};

export const fetchMentorById = async (id: string) => {
  const [mentorRes, languagesRes, expertiseRes, reviewsRes] = await Promise.all([
    supabase.from('mentors').select('*').eq('id', id).single(),
    supabase.from('mentor_languages').select('*').eq('mentor_id', id),
    supabase.from('mentor_expertise').select('*').eq('mentor_id', id),
    supabase
      .from('mentor_reviews')
      .select('*')
      .eq('mentor_id', id)
      .order('created_at', { ascending: false }),
  ]);

  return {
    mentor: mentorRes.data as MentorRow | null,
    languages: languagesRes.data ?? [],
    expertise: expertiseRes.data ?? [],
    reviews: reviewsRes.data ?? [],
    error:
      mentorRes.error || languagesRes.error || expertiseRes.error || reviewsRes.error,
  };
};

// ========================================
// 作成系
// ========================================

export const createMentor = async (data: MentorInsert) => {
  return await supabase.from('mentors').insert(data).select().single();
};

export const createMentorLanguages = async (languages: MentorLanguageInsert[]) => {
  if (languages.length === 0) return { data: [], error: null };
  return await supabase.from('mentor_languages').insert(languages).select();
};

export const createMentorExpertise = async (expertise: MentorExpertiseInsert[]) => {
  if (expertise.length === 0) return { data: [], error: null };
  return await supabase.from('mentor_expertise').insert(expertise).select();
};

export const createMentorAvailability = async (
  availability: MentorAvailabilityInsert[]
) => {
  if (availability.length === 0) return { data: [], error: null };
  return await supabase.from('mentor_availability').insert(availability).select();
};

// ========================================
// 画像アップロード
// ========================================

export const uploadAvatar = async (userId: string, file: File) => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/avatar.${fileExt}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (error) {
    return { url: null, error };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath);

  return { url: publicUrl, error: null };
};

// ========================================
// メンター登録（トランザクション的に全テーブルに保存）
// ========================================

type RegisterMentorParams = {
  supabaseClient: SupabaseClient;
  mentor: MentorInsert;
  languages: Omit<MentorLanguageInsert, 'mentor_id'>[];
  expertise: string[];
  availability: Omit<MentorAvailabilityInsert, 'mentor_id'>[];
  avatarFile?: File | null;
};

export const registerMentor = async ({
  supabaseClient,
  mentor,
  languages,
  expertise,
  availability,
  avatarFile,
}: RegisterMentorParams) => {
  // 1. 画像アップロード（ある場合）
  let avatarUrl = mentor.avatar_url;
  if (avatarFile) {
    const fileExt = avatarFile.name.split('.').pop();
    const filePath = `${mentor.user_id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('avatars')
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) {
      return { mentor: null, error: uploadError };
    }

    const {
      data: { publicUrl },
    } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);

    avatarUrl = publicUrl;
  }

  // 2. mentorsテーブルに保存
  const { data: mentorData, error: mentorError } = await supabaseClient
    .from('mentors')
    .insert({ ...mentor, avatar_url: avatarUrl })
    .select()
    .single();

  if (mentorError || !mentorData) {
    return { mentor: null, error: mentorError };
  }

  const mentorId = mentorData.id;

  // 3. 関連テーブルに保存（並列実行）
  const [languagesRes, expertiseRes, availabilityRes] = await Promise.all([
    languages.length > 0
      ? supabaseClient
          .from('mentor_languages')
          .insert(languages.map((lang) => ({ ...lang, mentor_id: mentorId })))
          .select()
      : Promise.resolve({ data: [], error: null }),
    expertise.length > 0
      ? supabaseClient
          .from('mentor_expertise')
          .insert(expertise.map((exp) => ({ mentor_id: mentorId, expertise: exp })))
          .select()
      : Promise.resolve({ data: [], error: null }),
    availability.length > 0
      ? supabaseClient
          .from('mentor_availability')
          .insert(availability.map((slot) => ({ ...slot, mentor_id: mentorId })))
          .select()
      : Promise.resolve({ data: [], error: null }),
  ]);

  const relatedError =
    languagesRes.error || expertiseRes.error || availabilityRes.error;

  if (relatedError) {
    // 関連テーブルの保存に失敗した場合、mentorレコードを削除してロールバック
    await supabaseClient.from('mentors').delete().eq('id', mentorId);
    return { mentor: null, error: relatedError };
  }

  return { mentor: mentorData, error: null };
};
