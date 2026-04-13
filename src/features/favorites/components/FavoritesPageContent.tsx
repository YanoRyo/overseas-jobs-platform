"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSessionContext, useUser } from "@supabase/auth-helpers-react";

import MentorCard from "@/components/MentorCard";

import { useFavorites } from "../context/FavoritesContext";

export function FavoritesPageContent() {
  const t = useTranslations("favorites");
  const router = useRouter();
  const pathname = usePathname();
  const user = useUser();
  const { isLoading: authLoading } = useSessionContext();
  const { favoriteMentors, loading } = useFavorites();

  return (
    <div className="min-h-screen bg-[#fafafb]">
      <main className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1f6]">
            <Heart className="h-7 w-7 fill-[#e11d48] text-[#e11d48]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#111827]">{t("title")}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {loading || authLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            {t("loadingFavorites")}
          </div>
        ) : !user ? (
          <div className="rounded-3xl border border-[#e5e7eb] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1f6]">
              <Heart className="h-8 w-8 text-[#e11d48]" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-[#111827]">
              {t("loginToSave")}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              {t("loginDescription")}
            </p>
            <button
              type="button"
              onClick={() => {
                const redirectTo = encodeURIComponent(pathname || "/favorites");
                router.push(`/auth/login?redirect=${redirectTo}`);
              }}
              className="mt-5 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              {t("loginButton")}
            </button>
          </div>
        ) : favoriteMentors.length === 0 ? (
          <div className="rounded-3xl border border-[#e5e7eb] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1f6]">
              <Heart className="h-8 w-8 text-[#e11d48]" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-[#111827]">
              {t("noFavorites")}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              {t("noFavoritesDescription")}
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-5 rounded-full bg-[#111827] px-5 py-2 text-sm font-semibold text-white"
            >
              {t("browseMentors")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {favoriteMentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onBook={() => router.push(`/mentors/${mentor.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
