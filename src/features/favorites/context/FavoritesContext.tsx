"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useSessionContext,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";

import { mapMentorList } from "@/features/mentors/mapper/mapMentorList";
import type { MentorListItem } from "@/features/mentors/types";
import type { MentorRow } from "@/lib/supabase/types";

type FavoriteRow = {
  mentor_id: string;
  created_at: string;
};

type FavoritesContextValue = {
  favoriteMentors: MentorListItem[];
  favoriteCount: number;
  loading: boolean;
  isFavorite: (mentorId: string) => boolean;
  toggleFavorite: (mentorId: string) => Promise<{ ok: boolean; error?: string }>;
  refreshFavorites: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const MENTOR_SELECT = `
  id,
  user_id,
  first_name,
  last_name,
  email,
  country_code,
  phone_country_code,
  phone_number,
  avatar_url,
  introduction,
  work_experience,
  motivation,
  headline,
  video_url,
  timezone,
  hourly_rate,
  has_no_degree,
  university,
  degree,
  degree_type,
  specialization,
  stripe_account_id,
  stripe_onboarding_completed,
  rating_avg,
  review_count,
  lessons_count,
  created_at,
  updated_at
`;

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useSupabaseClient();
  const user = useUser();
  const { isLoading: authLoading } = useSessionContext();
  const [favoriteMentors, setFavoriteMentors] = useState<MentorListItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const resolveUserId = useCallback(async () => {
    if (user?.id) return user.id;

    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("resolveUserId error", error);
      return null;
    }

    return authUser?.id ?? null;
  }, [supabase, user?.id]);

  const refreshFavorites = useCallback(async () => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    const userId = await resolveUserId();

    if (!userId) {
      setFavoriteMentors([]);
      setFavoriteIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: favorites, error: favoritesError } = await supabase
      .from("mentor_favorites")
      .select("mentor_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (favoritesError) {
      console.error("refreshFavorites favoritesError", favoritesError);
      setFavoriteMentors([]);
      setFavoriteIds([]);
      setLoading(false);
      return;
    }

    const rows = (favorites ?? []) as FavoriteRow[];
    const mentorIds = rows.map((row) => row.mentor_id);

    setFavoriteIds(mentorIds);

    if (mentorIds.length === 0) {
      setFavoriteMentors([]);
      setLoading(false);
      return;
    }

    const { data: mentors, error: mentorsError } = await supabase
      .from("mentors")
      .select(MENTOR_SELECT)
      .in("id", mentorIds);

    if (mentorsError) {
      console.error("refreshFavorites mentorsError", mentorsError);
      setFavoriteMentors([]);
      setLoading(false);
      return;
    }

    const mentorMap = new Map(
      ((mentors ?? []) as MentorRow[]).map((mentor) => [
        mentor.id,
        mapMentorList(mentor),
      ])
    );

    setFavoriteMentors(
      mentorIds
        .map((mentorId) => mentorMap.get(mentorId))
        .filter((mentor): mentor is MentorListItem => Boolean(mentor))
    );
    setLoading(false);
  }, [authLoading, resolveUserId, supabase]);

  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

  const toggleFavorite = useCallback(
    async (mentorId: string) => {
      const userId = await resolveUserId();

      if (!userId) {
        return { ok: false, error: "Login required" };
      }

      const alreadyFavorite = favoriteIds.includes(mentorId);

      if (alreadyFavorite) {
        const { error } = await supabase
          .from("mentor_favorites")
          .delete()
          .eq("user_id", userId)
          .eq("mentor_id", mentorId);

        if (error) {
          console.error("toggleFavorite delete error", error);
          return { ok: false, error: "Failed to remove favorite" };
        }
      } else {
        const { error } = await supabase
          .from("mentor_favorites")
          .insert({ user_id: userId, mentor_id: mentorId });

        if (error) {
          console.error("toggleFavorite insert error", error);
          return { ok: false, error: "Failed to save favorite" };
        }
      }

      await refreshFavorites();
      return { ok: true };
    },
    [favoriteIds, refreshFavorites, resolveUserId, supabase]
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteMentors,
      favoriteCount: favoriteIds.length,
      loading,
      isFavorite: (mentorId: string) => favoriteIds.includes(mentorId),
      toggleFavorite,
      refreshFavorites,
    }),
    [favoriteMentors, favoriteIds, loading, refreshFavorites, toggleFavorite]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }

  return context;
}
