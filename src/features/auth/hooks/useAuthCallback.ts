"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

export const useAuthCallback = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabaseClient();
  const user = useUser();

  useEffect(() => {
    const run = async () => {
      const redirect = searchParams.get("redirect") || "/";

      if (!user) return;
      await supabase.from("users").upsert({
        id: user.id,
        username: user.email?.split("@")[0] ?? "no-name",
        role: "student",
      });

      const pendingReservation = localStorage.getItem("pendingReservation");

      router.push(pendingReservation ? "/checkout" : redirect);
    };

    run();
  }, [user, supabase, router, searchParams]);
};
