import type {
  MentorRow,
  MentorLanguageRow,
  MentorExpertiseRow,
  MentorReviewRow,
} from '@/lib/supabase/types';
import { MentorDetailModel } from '../types';

export const mapMentorDetail = (
  mentor: MentorRow,
  languages: MentorLanguageRow[],
  expertise: MentorExpertiseRow[],
  reviews: MentorReviewRow[]
): MentorDetailModel => ({
  id: mentor.id,
  name: `${mentor.first_name} ${mentor.last_name}`,
  country: mentor.country_code,
  bio: mentor.introduction,
  avatarUrl: mentor.avatar_url ?? '',
  price: mentor.hourly_rate,
  rating: Number(mentor.rating_avg),
  reviewCount: mentor.review_count,
  subjects: expertise.map((e) => e.expertise),
  ratingsDetail: {
    // TODO: カテゴリ別評価機能追加時に対応
    教え方: 4.8,
    分かりやすさ: 4.7,
    対応力: 4.9,
    満足度: 4.8,
  },
  reviews: reviews.map((r) => ({
    id: r.id,
    author: r.user_id.slice(0, 8), // TODO: ユーザー名取得に変更
    rating: r.rating,
    comment: r.comment ?? '',
  })),
  lessons: mentor.lessons_count,
  specialties: expertise.map((e) => e.expertise),
  intro: mentor.motivation,
  introVideoUrl: mentor.video_url ?? '',
  spokenLanguages: languages.map((l) => ({
    name: l.language_name,
    level: l.proficiency_level,
  })),
});
