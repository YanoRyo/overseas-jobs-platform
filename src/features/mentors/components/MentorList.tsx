"use client";
import { useEffect, useState } from "react";
import { useMentorSearch } from "../hooks/useMentorSearch";
import SearchFilters from "@/components/SearchFilters";
import MentorCard from "@/components/MentorCard";
import BookingModal from "@/components/BookingModal";
import { MentorDetailModel, MentorListItem } from "../types";
import { fetchMentorById } from "@/lib/supabase/mentors";
import { mapMentorDetail } from "../mapper/mapMentorDetail";
import { useUser } from "@supabase/auth-helpers-react";
import { AuthModal } from "@/features/auth/components/AuthModal";

const PENDING_BOOKING_KEY = "pendingBookingMentorId";

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

  const user = useUser();
  const [selectedMentor, setSelectedMentor] =
    useState<MentorDetailModel | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingMentorId, setPendingMentorId] = useState<string | null>(null);

  // 初回マウント時に全件取得
  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [bookingError, setBookingError] = useState<string | null>(null);

  // メンター詳細を取得して BookingModal を開く
  const fetchAndOpenBooking = async (mentorId: string) => {
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
      } = await fetchMentorById(mentorId);

      if (fetchError || !data) {
        setBookingError("Failed to retrieve mentor information");
        return;
      }

      const detailModel = mapMentorDetail(
        data,
        languages,
        expertise,
        reviews,
        availability
      );
      setSelectedMentor(detailModel);
    } catch {
      setBookingError("Failed to retrieve mentor information.");
    } finally {
      setBookingLoading(false);
    }
  };

  // 予約ボタンクリック時の処理
  const handleBook = async (mentor: MentorListItem) => {
    if (!user) {
      // 未ログイン: AuthModal を表示し、メンターIDを localStorage に保存
      localStorage.setItem(PENDING_BOOKING_KEY, mentor.id);
      setPendingMentorId(mentor.id);
      setIsAuthModalOpen(true);
      return;
    }

    // ログイン済み: BookingModal を開く
    await fetchAndOpenBooking(mentor.id);
  };

  // OAuth認証後、ページリロード時に BookingModal を自動で開く
  useEffect(() => {
    const storedMentorId = localStorage.getItem(PENDING_BOOKING_KEY);
    if (user && storedMentorId) {
      localStorage.removeItem(PENDING_BOOKING_KEY);
      setIsAuthModalOpen(false);
      setPendingMentorId(null);
      fetchAndOpenBooking(storedMentorId);
    }
  }, [user]);

  // メール認証でのログイン成功後、AuthModal を閉じて BookingModal を開く
  useEffect(() => {
    if (user && pendingMentorId && isAuthModalOpen) {
      localStorage.removeItem(PENDING_BOOKING_KEY);
      setIsAuthModalOpen(false);
      fetchAndOpenBooking(pendingMentorId);
      setPendingMentorId(null);
    }
  }, [user, pendingMentorId, isAuthModalOpen]);

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
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

      <div
        className={`flex flex-col gap-4 ${
          loading ? "opacity-50 pointer-events-none" : ""
        }`}
      >
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
          No mentors matched your filters.
        </p>
      )}

      {bookingLoading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="status"
          aria-live="polite"
          aria-label="Loading mentor information"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/40 border-t-white" />
            <p className="text-white">Loading...</p>
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

      <AuthModal
        open={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingMentorId(null);
        }}
        defaultMode="login"
        initialRole="student"
        title="Log in to continue booking"
        description="You need to log in to book a lesson."
        redirectOnClose=""
        redirectAfterAuth="/"
      />
    </div>
  );
}
