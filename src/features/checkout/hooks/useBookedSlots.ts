"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type BookedSlot = {
  startTime: Date;
  endTime: Date;
  ownPending: boolean;
};

export const isBookedSlotOverlapping = (
  booking: BookedSlot,
  slotStart: Date,
  durationMinutes: number
): boolean => {
  const slotEnd = new Date(slotStart);
  slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

  if (
    booking.ownPending &&
    booking.startTime.getTime() === slotStart.getTime() &&
    booking.endTime.getTime() === slotEnd.getTime()
  ) {
    return false;
  }

  return slotStart < booking.endTime && slotEnd > booking.startTime;
};

const parseUtcTimestamp = (value: string) => {
  const hasTimeZoneSuffix = /(?:z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasTimeZoneSuffix ? value : `${value}Z`);
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

      const res = await fetch(
        `/api/bookings/booked-slots?mentorId=${encodeURIComponent(mentorId)}&weekStart=${encodeURIComponent(weekStart.toISOString())}`
      );

      if (!res.ok) {
        console.error("Failed to fetch booked slots:", res.status);
        setBookedSlots([]);
      } else {
        const { slots } = await res.json();
        setBookedSlots(
          (slots ?? []).map((row: {
            startTime: string;
            endTime: string;
            ownPending?: boolean;
          }) => ({
            // DBには timestamp without time zone だがUTC値が入っているため、Zを付与してUTCとして解釈
            startTime: parseUtcTimestamp(row.startTime),
            endTime: parseUtcTimestamp(row.endTime),
            ownPending: Boolean(row.ownPending),
          }))
        );
      }

      setLoading(false);
    };

    fetchBookings();
  }, [isOpen, mentorId, weekKey, userId]);

  // 区間重複チェック: slotStart < booking.endTime AND slotEnd > booking.startTime
  const isUtcSlotBooked = useCallback(
    (slotStart: Date, durationMinutes: number): boolean => {
      if (bookedSlots.length === 0) return false;

      return bookedSlots.some((booking) =>
        isBookedSlotOverlapping(booking, slotStart, durationMinutes)
      );
    },
    [bookedSlots]
  );

  const isSlotBooked = useCallback(
    (date: Date, timeString: string, durationMinutes: number): boolean => {
      const [hours, minutes] = timeString.split(":").map(Number);
      const slotStart = new Date(date);
      slotStart.setHours(hours, minutes, 0, 0);

      return isUtcSlotBooked(slotStart, durationMinutes);
    },
    [isUtcSlotBooked]
  );

  return { bookedSlots, loading, isSlotBooked, isUtcSlotBooked };
};
