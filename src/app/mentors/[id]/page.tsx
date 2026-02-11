"use client";

import { use, useState, useEffect } from "react";
import { useMentorDetail } from "@/features/mentors/hooks/useMentorDetail";
import { MentorDetail } from "@/features/mentors/components/MentorDetail";
import { useUser } from "@supabase/auth-helpers-react";
import { AuthModal } from "@/features/auth/components/AuthModal";

const PENDING_BOOKING_KEY = "pendingBookingMentorId";

export default function MentorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const user = useUser();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { mentor, loading, error, isBookingOpen, openBooking, closeBooking } =
    useMentorDetail(id);

  // OAuth認証後、ページリロード時にBookingModalを自動で開く
  useEffect(() => {
    const pendingMentorId = localStorage.getItem(PENDING_BOOKING_KEY);
    if (user && pendingMentorId === id) {
      localStorage.removeItem(PENDING_BOOKING_KEY);
      openBooking();
    }
  }, [user, id, openBooking]);

  // メール認証でのログイン成功後、AuthModalを閉じてBookingModalを開く
  useEffect(() => {
    if (user && isAuthModalOpen) {
      localStorage.removeItem(PENDING_BOOKING_KEY);
      setIsAuthModalOpen(false);
      openBooking();
    }
  }, [user, isAuthModalOpen, openBooking]);

  // 「Book Lesson」クリック時の処理
  const handleBookLesson = () => {
    if (user) {
      openBooking();
    } else {
      // OAuth認証でページがリロードされても予約を続行できるよう保存
      localStorage.setItem(PENDING_BOOKING_KEY, id);
      setIsAuthModalOpen(true);
    }
  };

  if (loading) return <div className="p-6">読み込み中...</div>;
  if (error || !mentor)
    return <div className="p-6">メンターが見つかりませんでした。</div>;

  return (
    <>
      <MentorDetail
        mentor={mentor}
        isBookingOpen={isBookingOpen}
        onOpenBooking={handleBookLesson}
        onCloseBooking={closeBooking}
      />
      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode="login"
        initialRole="student"
        title="ログインして予約を続ける"
        description="体験レッスンを予約するにはログインが必要です"
        redirectOnClose=""
        redirectAfterAuth={`/mentors/${id}`}
      />
    </>
  );
}
