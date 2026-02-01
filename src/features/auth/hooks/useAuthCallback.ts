"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import type { UserRole } from "../types";

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
      const role = isUserRole(roleParam) ? roleParam : null;

      if (!user) return;
      let shouldSetRole = !!role;

      if (role) {
        const { data: existing } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (existing?.role) {
          shouldSetRole = false;
        }
      }

      const payload: {
        id: string;
        username: string;
        role?: UserRole;
      } = {
        id: user.id,
        username: user.email?.split("@")[0] ?? "no-name",
      };

      if (shouldSetRole && role) {
        payload.role = role;
      }

      await supabase.from("users").upsert(payload);

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
          // mentor登録がない → 申請ページへ など
          router.push("/mentor/onboarding");
          return;
        }

        router.push("/mentor/dashboard");
        return;
      }

      // student
      const pending = localStorage.getItem("pendingReservation");
      router.push(pending ? "/checkout" : redirect);
    };

    run();
  }, [user, supabase, router, searchParams]);
};
