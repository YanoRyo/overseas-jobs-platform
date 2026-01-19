// ========================================
// Mentor関連の型定義（新スキーマ対応）
// ========================================

export type MentorRow = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  country_code: string;
  phone_country_code: string;
  phone_number: string;
  avatar_url: string | null;
  introduction: string;
  work_experience: string;
  motivation: string;
  headline: string;
  video_url: string | null;
  timezone: string;
  hourly_rate: number;
  has_no_degree: boolean;
  university: string | null;
  degree: string | null;
  degree_type: string | null;
  specialization: string | null;
  rating_avg: number;
  review_count: number;
  lessons_count: number;
  created_at: string;
  updated_at: string;
};

export type MentorLanguageRow = {
  id: string;
  mentor_id: string;
  language_code: string;
  language_name: string;
  proficiency_level: string;
};

export type MentorExpertiseRow = {
  id: string;
  mentor_id: string;
  expertise: string;
};

export type MentorAvailabilityRow = {
  id: string;
  mentor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_enabled: boolean;
};

export type MentorReviewRow = {
  id: string;
  mentor_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

// ========================================
// INSERT用の型（id, created_at等を除外）
// ========================================

export type MentorInsert = Omit<
  MentorRow,
  'id' | 'rating_avg' | 'review_count' | 'lessons_count' | 'created_at' | 'updated_at'
>;

export type MentorLanguageInsert = Omit<MentorLanguageRow, 'id'>;

export type MentorExpertiseInsert = Omit<MentorExpertiseRow, 'id'>;

export type MentorAvailabilityInsert = Omit<MentorAvailabilityRow, 'id'>;
