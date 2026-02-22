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
    setLoading(true);

    try {
      if (!user) {
        setProfile(null);
        return;
      }

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
    } catch (error) {
      console.error("fetchProfile unexpected error", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    void fetchProfile();
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
