"use client";

import { use, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useMentorDetail } from "@/features/mentors/hooks/useMentorDetail";
import { MentorDetail } from "@/features/mentors/components/MentorDetail";
import { useUser } from "@supabase/auth-helpers-react";
import { useAuthModal } from "@/features/auth/context/AuthModalProvider";
import { useCreateBooking } from "@/features/checkout/hooks/useCreateBooking";

const PENDING_BOOKING_KEY = "pendingBookingMentorId";
const PENDING_TIME_SLOT_KEY = "pendingTimeSlot";
const DEFAULT_DURATION = 25;

export default function MentorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("mentors");
  const tc = useTranslations("common");
  const user = useUser();
  const { openAuthModal } = useAuthModal();
  const { createBookingAndCheckout } = useCreateBooking();

  const { mentor, loading, error, isBookingOpen, openBooking, closeBooking } =
    useMentorDetail(id);

  // Scheduleの時間リンク → booking作成 → checkout遷移
  const processTimeSlotBooking = useCallback(
    async (dateKey: string, time: string) => {
      if (!user || !mentor) return;

      const startTime = new Date(`${dateKey}T${time}:00`);

      await createBookingAndCheckout({
        userId: user.id,
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorAvatarUrl: mentor.avatarUrl,
        mentorCountry: mentor.country,
        hourlyRate: mentor.price,
        duration: DEFAULT_DURATION,
        startTime,
        time,
      });
    },
    [user, mentor, createBookingAndCheckout]
  );

  // OAuth認証後、ページリロード時にBookingModalを自動で開く
  useEffect(() => {
    const pendingMentorId = localStorage.getItem(PENDING_BOOKING_KEY);
    if (user && pendingMentorId === id) {
      localStorage.removeItem(PENDING_BOOKING_KEY);
      openBooking();
    }
  }, [user, id, openBooking]);

  // 認証後の復帰: Scheduleの時間リンク経由の予約を再開
  useEffect(() => {
    if (!user || !mentor) return;
    const stored = localStorage.getItem(PENDING_TIME_SLOT_KEY);
    if (!stored) return;
    const { dateKey, time, mentorId: pendingMentorId } = JSON.parse(stored);
    if (pendingMentorId !== id) return;
    localStorage.removeItem(PENDING_TIME_SLOT_KEY);
    processTimeSlotBooking(dateKey, time);
  }, [user, id, mentor, processTimeSlotBooking]);

  // 「Book Lesson」クリック時の処理
  const handleBookLesson = () => {
    if (user) {
      openBooking();
    } else {
      localStorage.setItem(PENDING_BOOKING_KEY, id);
      openAuthModal({
        defaultMode: "login",
        initialRole: "student",
        variant: "booking",
      });
    }
  };

  // Scheduleの時間リンククリック時の処理
  const handleTimeSlotClick = (dateKey: string, time: string) => {
    if (user) {
      processTimeSlotBooking(dateKey, time);
    } else {
      localStorage.setItem(
        PENDING_TIME_SLOT_KEY,
        JSON.stringify({ dateKey, time, mentorId: id })
      );
      openAuthModal({
        defaultMode: "login",
        initialRole: "student",
        variant: "booking",
      });
    }
  };

  if (loading) return <div className="p-6">{tc("loading")}</div>;
  if (error || !mentor)
    return <div className="p-6">{t("mentorNotFound")}</div>;

  return (
    <>
      <MentorDetail
        mentor={mentor}
        isBookingOpen={isBookingOpen}
        onOpenBooking={handleBookLesson}
        onCloseBooking={closeBooking}
        onTimeSlotClick={handleTimeSlotClick}
      />
    </>
  );
}
