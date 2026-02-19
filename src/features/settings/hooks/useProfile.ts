"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import type { Profile } from "../types/profile";

export function useProfile() {
  const supabase = useSupabaseClient();
  const user = useUser();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, username, first_name, last_name, avatar_url, avatar_updated_at, phone_country_code, phone_number, timezone"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("fetchProfile error", error);
      setProfile(null);
    } else {
      setProfile((data as Profile) ?? null);
    }
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!user) return { ok: false };

      const { data, error } = await supabase
        .from("users")
        .update(patch)
        .eq("id", user.id)
        .select(
          "id, username, first_name, last_name, avatar_url, avatar_updated_at, phone_country_code, phone_number, timezone"
        )
        .single();

      if (error) {
        console.error("updateProfile error", error);
        return { ok: false };
      }

      setProfile(data as Profile);
      return { ok: true };
    },
    [supabase, user]
  );

  return { user, profile, loading, refetch: fetchProfile, updateProfile };
}
