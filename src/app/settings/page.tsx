"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  MentorSettingsLayout,
  MessagesLayout,
  SettingsLayout,
} from "@/features/settings";
import { MyLessonsLayout } from "@/features/settings/components/my-lessons/MyLessonsLayout";
import type { UserRole } from "@/features/auth/types";

type ViewerRole = UserRole | null;

function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabaseClient();
  const topTab = searchParams.get("tab");

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

  // トップナビの「My lessons」タブが選択された場合
  if (topTab === "my-lessons") {
    return <MyLessonsLayout role={viewerRole} />;
  }

  if (topTab === "messages") {
    return <MessagesLayout role={viewerRole} />;
  }

  if (viewerRole === "mentor") {
    return <MentorSettingsLayout />;
  }

  return <SettingsLayout />;
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-10 text-sm text-gray-400">Loading...</div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
