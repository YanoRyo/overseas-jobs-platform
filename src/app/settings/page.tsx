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

  useEffect(() => {
    const resolveRole = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login?redirect=/settings");
        setLoading(false);
        return;
      }

      const [{ data: userRow }, { data: mentorRow }] = await Promise.all([
        supabase.from("users").select("role").eq("id", user.id).maybeSingle(),
        supabase.from("mentors").select("id").eq("user_id", user.id).maybeSingle(),
      ]);

      const isMentor = userRow?.role === "mentor" || !!mentorRow;
      if (userRow?.role === "mentor" && !mentorRow) {
        router.replace("/mentor/register");
        setLoading(false);
        return;
      }

      setViewerRole(isMentor ? "mentor" : "student");
      setLoading(false);
    };

    resolveRole();
  }, [router, supabase]);

  if (loading) {
    return <div className="px-6 py-10 text-sm text-gray-400">Loading...</div>;
  }

  if (!viewerRole) return null;

  if (viewerRole === "mentor") {
    return <MentorSettingsLayout />;
  }

  return <SettingsLayout />;
}
