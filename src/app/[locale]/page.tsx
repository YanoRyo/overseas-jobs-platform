"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  useSessionContext,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import { MentorList } from "@/features/mentors/components/MentorList";
import { OnboardingLandingPage } from "@/features/home/components/OnboardingLandingPage";

export const dynamic = "force-dynamic";

type HomeView = "landing" | "mentor-list" | "redirecting";

export default function Home() {
  const tc = useTranslations("common");
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();
  const { isLoading: authLoading } = useSessionContext();
  const [homeView, setHomeView] = useState<HomeView>("landing");
  const [resolvingRole, setResolvingRole] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) {
      setResolvingRole(true);
      return () => {
        cancelled = true;
      };
    }

    if (!user) {
      setHomeView("landing");
      setResolvingRole(false);
      return () => {
        cancelled = true;
      };
    }

    const resolveViewerRole = async () => {
      if (!cancelled) {
        setResolvingRole(true);
        setHomeView("redirecting");
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

        if (isMentor) {
          router.replace("/settings");
          return;
        }

        setHomeView("mentor-list");
      } catch (error) {
        console.error("home viewer role resolve error", error);
        if (!cancelled) {
          setHomeView("mentor-list");
        }
      } finally {
        if (!cancelled) {
          setResolvingRole(false);
        }
      }
    };

    void resolveViewerRole();

    return () => {
      cancelled = true;
    };
  }, [authLoading, router, supabase, user]);

  if (authLoading || resolvingRole) {
    return <div className="px-6 py-10 text-sm text-gray-400">{tc("loading")}</div>;
  }

  if (homeView === "landing") {
    return <OnboardingLandingPage />;
  }

  if (homeView !== "mentor-list") {
    return null;
  }

  return <MentorList />;
}
