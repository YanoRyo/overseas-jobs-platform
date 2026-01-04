import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { mapMentorDetail } from "../mapper/mapMentorDetail";
import { MentorDetailModel } from "../types";

export const useMentorDetail = (id: string) => {
  const supabase = useSupabaseClient();
  const [mentor, setMentor] = useState<MentorDetailModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const fetchMentor = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("mentors")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError(true);
      } else {
        setMentor(mapMentorDetail(data));
      }

      setLoading(false);
    };

    fetchMentor();
  }, [id]);

  return {
    mentor,
    loading,
    error,
    isBookingOpen,
    openBooking: () => setIsBookingOpen(true),
    closeBooking: () => setIsBookingOpen(false),
  };
};
