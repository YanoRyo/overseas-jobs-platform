"use client";

import { useTranslations } from "next-intl";
import { MentorRegistrationCallout } from "../MentorRegistrationCallout";
import { SettingsTopTabs } from "../SettingsTopTabs";
import { MyLessonsTab } from "./MyLessonsTab";
import type { UserRole } from "@/features/auth/types";

type Props = {
  role: UserRole;
  showMentorRegistrationCallout?: boolean;
};

export function MyLessonsLayout({
  role,
  showMentorRegistrationCallout = false,
}: Props) {
  const t = useTranslations("settings.myLessons");

  if (showMentorRegistrationCallout) {
    return (
      <div className="min-h-screen bg-[#fafafb]">
        <SettingsTopTabs role={role} activeTabId="my-lessons" />

        <main className="mx-auto max-w-[1200px] px-6 py-10">
          <MentorRegistrationCallout />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafb]">
      <SettingsTopTabs role={role} activeTabId="my-lessons" />

      <main className="mx-auto max-w-[1200px] px-6 py-10">
        <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>
        <MyLessonsTab role={role} />
      </main>
    </div>
  );
}
