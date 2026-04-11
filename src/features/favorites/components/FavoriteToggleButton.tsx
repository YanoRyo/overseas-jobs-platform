"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSessionContext } from "@supabase/auth-helpers-react";

import { useFavorites } from "../context/FavoritesContext";

type Props = {
  mentorId: string;
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
};

export function FavoriteToggleButton({
  mentorId,
  showLabel = false,
  className = "",
  iconClassName = "h-5 w-5",
}: Props) {
  const t = useTranslations("favorites");
  const activeLabel = t("saved");
  const inactiveLabel = t("save");
  const { isLoading: authLoading } = useSessionContext();
  const router = useRouter();
  const pathname = usePathname();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [saving, setSaving] = useState(false);

  const favorite = isFavorite(mentorId);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (authLoading) {
      return;
    }

    setSaving(true);
    const result = await toggleFavorite(mentorId);
    setSaving(false);

    if (!result.ok && result.error === "Login required") {
      const redirectTo = encodeURIComponent(pathname || "/");
      router.push(`/auth/login?redirect=${redirectTo}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving || authLoading}
      aria-pressed={favorite}
      aria-label={favorite ? activeLabel : inactiveLabel}
      className={`inline-flex items-center justify-center gap-2 transition disabled:opacity-60 ${className}`}
    >
      <Heart
        className={`${iconClassName} ${
          favorite ? "fill-[#e11d48] text-[#e11d48]" : "text-[#111827]"
        }`}
      />
      {showLabel && <span>{favorite ? activeLabel : inactiveLabel}</span>}
    </button>
  );
}
