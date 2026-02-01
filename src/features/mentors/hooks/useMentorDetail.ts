import { useEffect, useState } from 'react';
import { fetchMentorById } from '@/lib/supabase/mentors';
import { mapMentorDetail } from '../mapper/mapMentorDetail';
import { MentorDetailModel } from '../types';

export const useMentorDetail = (id: string) => {
  const [mentor, setMentor] = useState<MentorDetailModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const fetchMentor = async () => {
      setLoading(true);
      const {
        mentor: data,
        languages,
        expertise,
        reviews,
        availability,
        error: fetchError,
      } = await fetchMentorById(id);

      if (fetchError || !data) {
        setError(true);
      } else {
        setMentor(mapMentorDetail(data, languages, expertise, reviews, availability));
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
