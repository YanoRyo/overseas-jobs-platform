"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

import type { UserRole } from "@/features/auth/types";
import Link from "next/link";
import FavoritesBox from "./FavoritesBox";
import MessageBox from "./MessageBox";
import UserMenu from "./UserMenu";

const isUserRole = (value: unknown): value is UserRole =>
  value === "student" || value === "mentor";

export function Header() {
  const pathname = usePathname();
  const supabase = useSupabaseClient();
  const user = useUser();
  const [viewerRole, setViewerRole] = useState<UserRole | null>(null);

  const metadataRole = isUserRole(user?.user_metadata?.role)
    ? user.user_metadata.role
    : null;
  const effectiveViewerRole = viewerRole ?? metadataRole;

  const hideRight =
    pathname?.startsWith("/auth") || pathname?.startsWith("/mentor/register");
  const hideHeaderActions = !!user && effectiveViewerRole !== "student";
  const homeHref = effectiveViewerRole === "mentor" ? "/settings" : "/";

  useEffect(() => {
    let cancelled = false;

    const resolveViewerRole = async () => {
      if (!user) {
        if (!cancelled) {
          setViewerRole(null);
        }
        return;
      }

      if (!cancelled) {
        setViewerRole(null);
      }

      try {
        const [userResult, mentorResult] = await Promise.all([
          supabase.from("users").select("role").eq("id", user.id).maybeSingle(),
          supabase.from("mentors").select("id").eq("user_id", user.id).maybeSingle(),
        ]);

        if (cancelled) return;

        if (userResult.error) {
          throw userResult.error;
        }
        if (mentorResult.error) {
          throw mentorResult.error;
        }

        const isMentor =
          userResult.data?.role === "mentor" || !!mentorResult.data;

        setViewerRole(isMentor ? "mentor" : "student");
      } catch (error) {
        console.error("header viewer role resolve error", error);
        if (!cancelled) {
          setViewerRole(metadataRole);
        }
      }
    };

    void resolveViewerRole();

    return () => {
      cancelled = true;
    };
  }, [metadataRole, supabase, user]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="flex items-center justify-between h-16 px-6">
        {/* 左：ロゴ */}
        <Link href={homeHref} className="font-bold text-xl">
          Bridgeee
        </Link>

        {/* 右：メッセージ・通知・ユーザー*/}
        {!hideRight && (
          <div className="flex items-center gap-4">
            {!hideHeaderActions && (
              <>
                <MessageBox />
                <FavoritesBox />
              </>
            )}
            <UserMenu viewerRole={effectiveViewerRole} />
          </div>
        )}
      </div>
    </header>
  );
}
