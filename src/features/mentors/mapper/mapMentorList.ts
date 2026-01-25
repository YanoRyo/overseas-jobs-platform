import { MentorRow } from '@/lib/supabase/types';
import { MentorListItem } from '../types';

export const mapMentorList = (row: MentorRow): MentorListItem => {
  return {
    id: row.id,
    name: `${row.first_name} ${row.last_name}`,
    countryCode: row.country_code,
    headline: row.headline,
    introduction: row.introduction,
    avatarUrl: row.avatar_url,
    hourlyRate: row.hourly_rate,
    reviewCount: row.review_count,
    rating: Number(row.rating_avg),
    createdAt: row.created_at,
  };
};
