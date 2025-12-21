"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export const useAuthCallback = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const redirect = searchParams.get("redirect") || "/";
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        await supabase.from("users").upsert({
          id: data.user.id,
          username: data.user.email?.split("@")[0],
          role: "student",
        });
      }

      router.push(redirect);
    };

    run();
  }, [router, searchParams]);
};
