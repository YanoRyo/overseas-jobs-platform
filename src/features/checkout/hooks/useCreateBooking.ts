"use client";
import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { ReservationData } from "../types/reservation";

type BookingParams = {
  userId: string;
  mentorId: string;
  mentorName: string;
  mentorAvatarUrl: string;
  mentorCountry: string;
  hourlyRate: number;
  duration: number;
  startTime: Date;
  time: string;
};

/**
 * 予約レコード作成 → localStorage保存 → /checkout遷移を共通化したhook。
 * BookingModalとMentorDetailPage(Schedule経由)の両方で使用。
 */
export function useCreateBooking() {
  const supabase = useSupabaseClient();
  const router = useRouter();

  const createBookingAndCheckout = useCallback(
    async (params: BookingParams) => {
      const endTime = new Date(params.startTime);
      endTime.setMinutes(endTime.getMinutes() + params.duration);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          user_id: params.userId,
          mentor_id: params.mentorId,
          start_time: params.startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: "pending",
          expires_at: expiresAt,
        })
        .select("id")
        .single();

      if (error || !booking) {
        alert("Failed to create the booking. Please try again.");
        return false;
      }

      const reservation: ReservationData = {
        bookingId: booking.id,
        mentorId: params.mentorId,
        mentorName: params.mentorName,
        mentorAvatarUrl: params.mentorAvatarUrl,
        mentorCountry: params.mentorCountry,
        hourlyRate: params.hourlyRate,
        duration: params.duration,
        date: params.startTime.toISOString(),
        time: params.time,
      };
      localStorage.setItem("pendingReservation", JSON.stringify(reservation));

      router.push("/checkout");
      return true;
    },
    [supabase, router]
  );

  return { createBookingAndCheckout };
}
