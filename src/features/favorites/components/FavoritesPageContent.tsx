"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSessionContext, useUser } from "@supabase/auth-helpers-react";

import MentorCard from "@/components/MentorCard";

import { useFavorites } from "../context/FavoritesContext";

export function FavoritesPageContent() {
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
            <h1 className="text-3xl font-bold text-[#111827]">Favorites</h1>
            <p className="mt-1 text-sm text-gray-500">
              Saved mentors will appear here.
            </p>
          </div>
        </div>

        {loading || authLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Loading favorites...
          </div>
        ) : !user ? (
          <div className="rounded-3xl border border-[#e5e7eb] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1f6]">
              <Heart className="h-8 w-8 text-[#e11d48]" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-[#111827]">
              Log in to save favorites
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Save mentors from the list or detail page and access them quickly
              from here.
            </p>
            <button
              type="button"
              onClick={() => {
                const redirectTo = encodeURIComponent(pathname || "/favorites");
                router.push(`/auth/login?redirect=${redirectTo}`);
              }}
              className="mt-5 rounded-full bg-[#111827] px-5 py-2 text-sm font-semibold text-white"
            >
              Log In
            </button>
          </div>
        ) : favoriteMentors.length === 0 ? (
          <div className="rounded-3xl border border-[#e5e7eb] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1f6]">
              <Heart className="h-8 w-8 text-[#e11d48]" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-[#111827]">
              No favorites yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Save mentors from the list or detail page and access them quickly
              from here.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-5 rounded-full bg-[#111827] px-5 py-2 text-sm font-semibold text-white"
            >
              Browse mentors
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
