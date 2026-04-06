"use client";

import { SettingsTopTabs } from "../SettingsTopTabs";
import { MyLessonsTab } from "./MyLessonsTab";
import type { UserRole } from "@/features/auth/types";

type Props = {
  role: UserRole;
};

export function MyLessonsLayout({ role }: Props) {
  return (
    <div className="min-h-screen bg-[#fafafb]">
      <SettingsTopTabs role={role} activeTabId="my-lessons" />

      <main className="mx-auto max-w-[1200px] px-6 py-10">
        <h1 className="text-3xl font-bold mb-6">My Lessons</h1>
        <MyLessonsTab role={role} />
      </main>
    </div>
  );
}
