"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import type { UserRole } from "../types";
import { syncUserProfile } from "../utils/syncUserProfile";

const isUserRole = (value: string | null): value is UserRole =>
  value === "student" || value === "mentor";

export const useAuthCallback = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabaseClient();
  const user = useUser();

  useEffect(() => {
    const run = async () => {
      const redirect = searchParams.get("redirect") || "/";
      const roleParam = searchParams.get("role");
      const metadataRole = isUserRole(user?.user_metadata?.role)
        ? user.user_metadata.role
        : null;
      const role = isUserRole(roleParam) ? roleParam : metadataRole;

      if (!user) return;
      const syncResult = await syncUserProfile(role);
      if (!syncResult.ok) {
        console.error("auth callback sync error", syncResult.error);
      }

      if (role === "mentor") {
        // mentors.user_id に自分がいるかチェック
        const { data: mentorRow, error } = await supabase
          .from("mentors")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error(error);
          router.push("/auth/login?role=mentor");
          return;
        }

        if (!mentorRow) {
          // mentor登録がない → 登録ページへ
          router.push("/mentor/register");
          return;
        }

        // TODO: /mentor/dashboard ページを作成後に変更
        router.push("/");
        return;
      }

      // student
      // pendingBookingMentorId がある場合は redirect を優先（BookingModal を開くため）
      const pendingBooking = localStorage.getItem("pendingBookingMentorId");
      if (pendingBooking) {
        router.push(redirect);
        return;
      }

      const pending = localStorage.getItem("pendingReservation");
      router.push(pending && redirect === "/checkout" ? "/checkout" : redirect);
    };

    run();
  }, [user, supabase, router, searchParams]);
};
