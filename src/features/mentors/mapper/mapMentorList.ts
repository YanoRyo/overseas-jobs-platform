import { MentorRow } from "@/lib/supabase/types";
import { MentorListItem } from "../types";
export const mapMentorList = (row: MentorRow): MentorListItem => {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    location: row.location,
    languages: row.languages,
    jobTitle: row.job_title,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    price: row.price,
    reviews: row.reviews,
    rating: row.rating,
    createdAt: row.created_at,
  };
};
