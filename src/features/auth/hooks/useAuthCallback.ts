"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

export const useAuthCallback = () => {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = useSupabaseClient();
  const user = useUser();

  useEffect(() => {
    const run = async () => {
      if (!user) return;

      const role = (sp.get("role") ?? "student") as "student" | "mentor";
      const redirect = sp.get("redirect") || "/";

      await supabase.from("users").upsert({
        id: user.id,
        username: user.email?.split("@")[0] ?? "no-name",
        role, // ← roleを反映
      });

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
  }, [user, supabase, router, sp]);
};
