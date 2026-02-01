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

  const [bookingError, setBookingError] = useState<string | null>(null);

  // 予約ボタンクリック時にメンター詳細を取得
  const handleBook = async (mentor: MentorListItem) => {
    setBookingLoading(true);
    setBookingError(null);
    try {
      const {
        mentor: data,
        languages,
        expertise,
        reviews,
        availability,
        error: fetchError,
      } = await fetchMentorById(mentor.id);

      if (fetchError || !data) {
        setBookingError("Failed to retrieve mentor information");
        return;
      }

      const detailModel = mapMentorDetail(data, languages, expertise, reviews, availability);
      setSelectedMentor(detailModel);
    } catch {
      setBookingError("メンター情報の取得に失敗しました");
    } finally {
      setBookingLoading(false);
    }
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
      {bookingError && <p className="text-red-500">{bookingError}</p>}

      {loading && mentors.length === 0 && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      )}

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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="status"
          aria-live="polite"
          aria-label="メンター情報を読み込み中"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/40 border-t-white" />
            <p className="text-white">読み込み中...</p>
          </div>
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
