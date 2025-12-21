import { supabase } from "./client";

export const fetchMentors = async () => {
  return await supabase
    .from("mentors")
    .select("*")
    .order("created_at", { ascending: false });
};
