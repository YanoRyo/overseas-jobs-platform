"use client";
import { useEffect, useState } from "react";
import { useMentorSearch } from "../hooks/useMentorSearch";
import SearchFilters from "@/components/SearchFilters";
import MentorCard from "@/components/MentorCard";
import BookingModal from "@/components/BookingModal";
import { MentorDetailModel, MentorListItem } from "../types";
import { fetchMentorById } from "@/lib/supabase/mentors";
import { mapMentorDetail } from "../mapper/mapMentorDetail";

export function MentorList() {
  const {
    filters,
    updateFilter,
    search,
    mentors,
    loading,
    error,
    hitCount,
    hasSearched,
  } = useMentorSearch();

  const [selectedMentor, setSelectedMentor] =
    useState<MentorDetailModel | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // 初回マウント時に全件取得
  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 予約ボタンクリック時にメンター詳細を取得
  const handleBook = async (mentor: MentorListItem) => {
    setBookingLoading(true);
    const { mentor: data, languages, expertise, reviews } = await fetchMentorById(mentor.id);

    if (data) {
      const detailModel = mapMentorDetail(data, languages, expertise, reviews);
      setSelectedMentor(detailModel);
    }
    setBookingLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-screen-md mx-auto w-full">
      {/* 検索フィルター */}
      <SearchFilters
        filters={filters}
        onFilterChange={updateFilter}
        onSearch={search}
        hitCount={hitCount}
        loading={loading}
      />

      {error && <p className="text-red-500">{error}</p>}

      <div className={loading ? "opacity-50 pointer-events-none" : ""}>
        {mentors.map((mentor) => (
          <MentorCard
            key={mentor.id}
            mentor={mentor}
            onBook={() => handleBook(mentor)}
          />
        ))}
      </div>

      {!loading && hasSearched && mentors.length === 0 && (
        <p className="text-secondary text-center py-8">
          条件に一致するメンターが見つかりませんでした
        </p>
      )}

      {bookingLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <p className="text-white">読み込み中...</p>
        </div>
      )}

      {selectedMentor && (
        <BookingModal
          mentor={selectedMentor}
          isOpen
          onClose={() => setSelectedMentor(null)}
        />
      )}
    </div>
  );
}
