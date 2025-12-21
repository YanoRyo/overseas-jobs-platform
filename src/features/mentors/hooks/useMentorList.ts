"use client";
import { useEffect, useState } from "react";
import { fetchMentors } from "@/lib/supabase/mentors";
import { mapMentorList } from "../mapper/mapMentorList";
import { MentorListItem } from "../types";

export const useMentorList = () => {
  const [mentors, setMentors] = useState<MentorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await fetchMentors();
      if (error) setError("メンター取得失敗");
      else setMentors((data || []).map(mapMentorList));
      setLoading(false);
    };
    load();
  }, []);

  return { mentors, loading, error };
};
