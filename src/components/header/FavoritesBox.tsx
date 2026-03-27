"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

import { useFavorites } from "@/features/favorites/context/FavoritesContext";

export default function FavoritesBox() {
  const router = useRouter();
  const { favoriteCount } = useFavorites();

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-full p-2 hover:bg-gray-100"
        aria-label="favorites"
        onClick={() => router.push("/favorites")}
      >
        <Heart className="h-6 w-6" />
        {favoriteCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
            {favoriteCount > 99 ? "99+" : favoriteCount}
          </span>
        )}
      </button>
    </div>
  );
}
