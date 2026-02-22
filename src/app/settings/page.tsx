"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { MentorSettingsLayout, SettingsLayout } from "@/features/settings";
import type { UserRole } from "@/features/auth/types";

type ViewerRole = UserRole | null;

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [viewerRole, setViewerRole] = useState<ViewerRole>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolveRole = async () => {
      if (!cancelled) {
        setLoading(true);
        setLoadError(null);
      }

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          if (!cancelled) {
            router.replace("/auth/login?redirect=/settings");
          }
          return;
        }

        const [userResult, mentorResult] = await Promise.all([
          supabase.from("users").select("role").eq("id", user.id).maybeSingle(),
          supabase.from("mentors").select("id").eq("user_id", user.id).maybeSingle(),
        ]);

        if (userResult.error) {
          throw userResult.error;
        }
        if (mentorResult.error) {
          throw mentorResult.error;
        }

        const isMentor =
          userResult.data?.role === "mentor" || !!mentorResult.data;
        if (userResult.data?.role === "mentor" && !mentorResult.data) {
          if (!cancelled) {
            router.replace("/mentor/register");
          }
          return;
        }

        if (!cancelled) {
          setViewerRole(isMentor ? "mentor" : "student");
        }
      } catch (error) {
        console.error("resolveRole error", error);
        if (!cancelled) {
          setViewerRole("student");
          setLoadError("Failed to resolve user role. Showing fallback settings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void resolveRole();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  if (loading) {
    return <div className="px-6 py-10 text-sm text-gray-400">Loading...</div>;
  }

  if (!viewerRole) {
    if (!loadError) return null;
    return (
      <div className="px-6 py-10 text-sm text-red-500">
        {loadError ?? "Unable to load settings."}
      </div>
    );
  }

  if (viewerRole === "mentor") {
    return <MentorSettingsLayout />;
  }

  return <SettingsLayout />;
}
