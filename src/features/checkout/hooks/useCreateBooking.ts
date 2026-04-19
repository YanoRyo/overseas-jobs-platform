"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
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
  const router = useRouter();

  const createBookingAndCheckout = useCallback(
    async (params: BookingParams) => {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mentorId: params.mentorId,
          startTime: params.startTime.toISOString(),
          duration: params.duration,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { bookingId?: string | number; error?: string }
        | null;

      if (!response.ok || !body?.bookingId) {
        console.error("Failed to create booking:", {
          status: response.status,
          error: body?.error ?? null,
          mentorId: params.mentorId,
          startTime: params.startTime.toISOString(),
          duration: params.duration,
        });
        alert(body?.error ?? "Failed to create the booking. Please try again.");
        return false;
      }

      const reservation: ReservationData = {
        bookingId: String(body.bookingId),
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
    [router]
  );

  return { createBookingAndCheckout };
}
