import type {
  MentorRow,
  MentorLanguageRow,
  MentorExpertiseRow,
  MentorReviewRow,
  MentorAvailabilityRow,
} from "@/lib/supabase/types";
import { MentorDetailModel } from "../types";

export const mapMentorDetail = (
  mentor: MentorRow,
  languages: MentorLanguageRow[],
  expertise: MentorExpertiseRow[],
  reviews: MentorReviewRow[],
  availability: MentorAvailabilityRow[]
): MentorDetailModel => ({
  id: mentor.id,
  userId: mentor.user_id,
  name: `${mentor.first_name} ${mentor.last_name}`,
  country: mentor.country_code,
  bio: mentor.introduction,
  avatarUrl: mentor.avatar_url ?? "",
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
  timezone: mentor.timezone,
  availability: availability.map((slot) => ({
    dayOfWeek: slot.day_of_week,
    startTime: slot.start_time,
    endTime: slot.end_time,
    isEnabled: slot.is_enabled,
  })),
  reviews: reviews.map((r) => ({
    id: r.id,
    author: r.user_id.slice(0, 8), // TODO: ユーザー名取得に変更
    rating: r.rating,
    comment: r.comment ?? "",
    createdAt: r.created_at,
  })),
  lessons: mentor.lessons_count,
  specialties: expertise.map((e) => e.expertise),
  intro: mentor.motivation,
  introVideoUrl: mentor.video_url ?? "",
  workExperience: mentor.work_experience,
  hasNoDegree: mentor.has_no_degree,
  university: mentor.university,
  degree: mentor.degree,
  degreeType: mentor.degree_type,
  specialization: mentor.specialization,
  spokenLanguages: languages.map((l) => ({
    name: l.language_name,
    level: l.proficiency_level,
  })),
});
