"use client";

import { use } from "react";
import { useMentorDetail } from "@/features/mentors/hooks/useMentorDetail";
import { MentorDetail } from "@/features/mentors/components/MentorDetail";

export default function MentorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { mentor, loading, error, isBookingOpen, openBooking, closeBooking } =
    useMentorDetail(id);

  if (loading) return <div className="p-6">読み込み中...</div>;
  if (error || !mentor)
    return <div className="p-6">メンターが見つかりませんでした。</div>;
  return (
    <MentorDetail
      mentor={mentor}
      isBookingOpen={isBookingOpen}
      onOpenBooking={openBooking}
      onCloseBooking={closeBooking}
    />
  );
}
