"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
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
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabaseClient();
  const topTab = searchParams.get("tab");

  const [loading, setLoading] = useState(true);
  const [viewerRole, setViewerRole] = useState<ViewerRole>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [needsMentorRegistration, setNeedsMentorRegistration] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resolveRole = async () => {
      if (!cancelled) {
        setLoading(true);
        setLoadError(null);
        setNeedsMentorRegistration(false);
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
        const mentorProfileMissing =
          userResult.data?.role === "mentor" && !mentorResult.data;

        if (!cancelled) {
          setViewerRole(isMentor ? "mentor" : "student");
          setNeedsMentorRegistration(mentorProfileMissing);
        }
      } catch (error) {
        console.error("resolveRole error", error);
        if (!cancelled) {
          setViewerRole("student");
          setNeedsMentorRegistration(false);
          setLoadError(t("loadError"));
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
    return <div className="px-6 py-10 text-sm text-gray-400">{tc("loading")}</div>;
  }

  if (!viewerRole) {
    if (!loadError) return null;
    return (
      <div className="px-6 py-10 text-sm text-red-500">
        {loadError ?? t("unableToLoad")}
      </div>
    );
  }

  // トップナビの「My lessons」タブが選択された場合
  if (topTab === "my-lessons") {
    return (
      <MyLessonsLayout
        role={viewerRole}
        showMentorRegistrationCallout={needsMentorRegistration}
      />
    );
  }

  if (topTab === "messages") {
    return (
      <MessagesLayout
        role={viewerRole}
        showMentorRegistrationCallout={needsMentorRegistration}
      />
    );
  }

  if (viewerRole === "mentor") {
    return (
      <MentorSettingsLayout
        showMentorRegistrationCallout={needsMentorRegistration}
      />
    );
  }

  return <SettingsLayout />;
}

function SettingsFallback() {
  const tc = useTranslations("common");
  return <div className="px-6 py-10 text-sm text-gray-400">{tc("loading")}</div>;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsPageContent />
    </Suspense>
  );
}
