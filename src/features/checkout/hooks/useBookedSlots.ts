"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

type BookedSlot = {
  startTime: Date;
  endTime: Date;
};

/**
 * 指定メンターの表示週内にあるpending予約を取得し、
 * 時間スロットが予約済みかどうかを判定する
 */
export const useBookedSlots = (
  mentorId: string,
  selectedDate: Date,
  isOpen: boolean,
  userId: string | undefined
) => {
  const supabase = useSupabaseClient();
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // selectedDateから週の開始日(日曜)を算出し、文字列化して安定した依存値にする
  const dateString = selectedDate.toDateString();
  const weekKey = useMemo(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateString]);

  useEffect(() => {
    if (!isOpen || !mentorId || !userId) return;

    const fetchBookings = async () => {
      setLoading(true);

      const weekStart = new Date(weekKey);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // 自分以外のpending予約を取得（自分のpending予約はブロック対象外）
      const { data, error } = await supabase
        .from("bookings")
        .select("start_time, end_time")
        .eq("mentor_id", mentorId)
        .eq("status", "pending")
        .neq("user_id", userId)
        .gte("start_time", weekStart.toISOString())
        .lt("start_time", weekEnd.toISOString());

      if (error) {
        console.error("Failed to fetch booked slots:", error);
        setBookedSlots([]);
      } else {
        setBookedSlots(
          (data ?? []).map((row) => ({
            // DBには timestamp without time zone だがUTC値が入っているため、Zを付与してUTCとして解釈
            startTime: new Date(row.start_time + "Z"),
            endTime: new Date(row.end_time + "Z"),
          }))
        );
      }

      setLoading(false);
    };

    fetchBookings();
  }, [isOpen, mentorId, weekKey, userId, supabase]);

  // 区間重複チェック: slotStart < booking.endTime AND slotEnd > booking.startTime
  const isSlotBooked = useCallback(
    (date: Date, timeString: string, durationMinutes: number): boolean => {
      if (bookedSlots.length === 0) return false;

      const [hours, minutes] = timeString.split(":").map(Number);
      const slotStart = new Date(date);
      slotStart.setHours(hours, minutes, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      return bookedSlots.some(
        (booking) => slotStart < booking.endTime && slotEnd > booking.startTime
      );
    },
    [bookedSlots]
  );

  return { bookedSlots, loading, isSlotBooked };
};
