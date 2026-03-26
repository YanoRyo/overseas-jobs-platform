"use client";

import { useEffect, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import type { LessonItem, GroupedLessons } from "../types/myLessons";

type BookingRow = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  mentor_id: string;
};

type MentorRow = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  country_code: string;
};

type PaymentRow = {
  booking_id: string;
  amount: number;
  currency: string;
  status: string;
};

function groupLessons(items: LessonItem[]): GroupedLessons {
  const upcoming: LessonItem[] = [];
  const pending: LessonItem[] = [];
  const completed: LessonItem[] = [];

  for (const item of items) {
    switch (item.status) {
      case "confirmed":
        upcoming.push(item);
        break;
      case "pending":
        pending.push(item);
        break;
      case "completed":
        completed.push(item);
        break;
    }
  }

  // upcoming: 日時の昇順（近い順）
  upcoming.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  // pending: 日時の昇順
  pending.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  // completed: 日時の降順（最近のものが上）
  completed.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  return { upcoming, pending, completed };
}

export function useMyLessons() {
  const supabase = useSupabaseClient();
  const user = useUser();

  const [lessons, setLessons] = useState<GroupedLessons>({
    upcoming: [],
    pending: [],
    completed: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchLessons = async () => {
      setLoading(true);
      setError(null);

      // 1. bookings取得
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, start_time, end_time, status, mentor_id")
        .eq("user_id", user.id)
        .in("status", ["confirmed", "pending", "completed"]);

      if (bookingsError) {
        console.error("=== Failed to fetch bookings:", bookingsError.message);
        setError("レッスン情報の取得に失敗しました");
        setLoading(false);
        return;
      }

      if (!bookings || bookings.length === 0) {
        setLessons({ upcoming: [], pending: [], completed: [] });
        setLoading(false);
        return;
      }

      // 2. 関連するmentor情報を取得
      const mentorIds = [...new Set(bookings.map((b) => b.mentor_id))];
      const { data: mentors } = await supabase
        .from("mentors")
        .select("id, first_name, last_name, avatar_url, country_code")
        .in("id", mentorIds);

      const mentorMap = new Map<string, MentorRow>();
      for (const m of mentors ?? []) {
        mentorMap.set(m.id, m as MentorRow);
      }

      // 3. 関連するpayment情報を取得
      const bookingIds = bookings.map((b) => b.id);
      const { data: payments } = await supabase
        .from("payments")
        .select("booking_id, amount, currency, status")
        .in("booking_id", bookingIds);

      const paymentMap = new Map<string, PaymentRow>();
      for (const p of payments ?? []) {
        paymentMap.set(p.booking_id, p as PaymentRow);
      }

      // 4. データを結合
      const items: LessonItem[] = bookings.map((b) => {
        const booking = b as BookingRow;
        const mentor = mentorMap.get(booking.mentor_id);
        const payment = paymentMap.get(booking.id);

        return {
          id: booking.id,
          // DBには timestamp without time zone だがUTC値が入っているため、Zを付与してUTCとして解釈
          startTime: new Date(booking.start_time + "Z"),
          endTime: new Date(booking.end_time + "Z"),
          status: booking.status as LessonItem["status"],
          mentorName: mentor
            ? `${mentor.first_name} ${mentor.last_name}`
            : "Unknown",
          mentorAvatarUrl: mentor?.avatar_url ?? null,
          mentorCountry: mentor?.country_code ?? "",
          amount: payment?.amount ?? null,
          currency: payment?.currency ?? "usd",
          paymentStatus: payment
            ? (payment.status as LessonItem["paymentStatus"])
            : null,
        };
      });

      setLessons(groupLessons(items));
      setLoading(false);
    };

    fetchLessons();
  }, [user?.id, supabase]);

  return { lessons, loading, error };
}
