"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useMyLessons } from "../../hooks/useMyLessons";
import { LessonCard } from "./LessonCard";
import type { LessonItem } from "../../types/myLessons";
import type { UserRole } from "@/features/auth/types";

function LessonSection({
  title,
  items,
}: {
  title: string;
  items: LessonItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-primary">{title}</h2>
      <div className="space-y-3">
        {items.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  );
}

export function MyLessonsTab({ role }: { role: UserRole }) {
  const t = useTranslations("settings.myLessons");
  const tc = useTranslations("common");
  const { lessons, loading, error } = useMyLessons(role);

  if (loading) {
    return <p className="text-sm text-gray-400">{tc("loading")}</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  const isEmpty =
    lessons.upcoming.length === 0 &&
    lessons.pending.length === 0 &&
    lessons.completed.length === 0;

  if (isEmpty) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
        <p className="text-secondary">
          {role === "mentor"
            ? t("noLessonsBooked")
            : t("noLessonsYet")}
        </p>
        {role === "student" ? (
          <Link
            href="/"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            {t("findMentor")}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <LessonSection title={t("upcoming")} items={lessons.upcoming} />
      <LessonSection title={t("pending")} items={lessons.pending} />
      <LessonSection title={t("completed")} items={lessons.completed} />
    </div>
  );
}
