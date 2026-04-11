"use client";
import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const syncResult = await syncUserProfile(
        role,
        session?.access_token ?? null
      );
      if (!syncResult.ok) {
        console.error("auth callback sync error", syncResult.error);
      }

      let isMentor = role === "mentor";

      try {
        const [userResult, mentorResult] = await Promise.all([
          supabase.from("users").select("role").eq("id", user.id).maybeSingle(),
          supabase.from("mentors").select("id").eq("user_id", user.id).maybeSingle(),
        ]);

        if (userResult.error) {
          throw userResult.error;
        }
        if (mentorResult.error) {
          throw mentorResult.error;
        }

        isMentor =
          userResult.data?.role === "mentor" || !!mentorResult.data;
      } catch (error) {
        console.error("auth callback role resolve error", error);
      }

      if (isMentor) {
        router.replace("/settings");
        return;
      }

      // student
      // pendingBookingMentorId がある場合は redirect を優先（BookingModal を開くため）
      const pendingBooking = localStorage.getItem("pendingBookingMentorId");
      if (pendingBooking) {
        router.replace(redirect);
        return;
      }

      const pending = localStorage.getItem("pendingReservation");
      router.replace(
        pending && redirect === "/checkout" ? "/checkout" : redirect
      );
    };

    run();
  }, [user, supabase, router, searchParams]);
};
