"use client";
import { useState, useEffect } from "react";
import { Mentor } from "../types/mentor";
import { supabase } from "../lib/supabase";
import SearchFilters from "../components/SearchFilters";
import MentorCard from "../components/MentorCard";
import BookingModal from "../components/BookingModal";

export default function Home() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  useEffect(() => {
    const fetchMentors = async () => {
      const { data, error } = await supabase
        .from("mentors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching mentors:", error.message);
        setError("メンターの取得に失敗しました。");
      } else {
        // snake_case → camelCase 変換
        const formatted: Mentor[] = (data || []).map((mentor) => ({
          id: mentor.id,
          name: mentor.name,
          country: mentor.country,
          location: mentor.location,
          languages: mentor.languages,
          job: mentor.job,
          bio: mentor.bio,
          avatarUrl: mentor.avatar_url,
          price: mentor.price,
          reviews: mentor.reviews,
          rating: mentor.rating,
          createdAt: mentor.created_at,
        }));
        setMentors(formatted);
      }
      setLoading(false);
    };

    fetchMentors();
  }, []);
  return (
    <div className="flex flex-col gap-6 p-6 max-w-screen-md mx-auto w-full">
      {/* 検索フィルター */}
      <SearchFilters />

      {loading && <p>読み込み中...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {/* メンタリスト */}
      {!loading &&
        mentors.map((mentor) => (
          <MentorCard
            key={mentor.id}
            mentor={mentor}
            onBook={() => setSelectedMentor(mentor)}
          />
        ))}
      {/* モーダル */}
      {selectedMentor && (
        <BookingModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
          isOpen={true}
        />
      )}
    </div>
  );
}
