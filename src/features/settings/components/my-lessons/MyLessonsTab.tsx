"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { UserRole } from "@/features/auth/types";
import { useMyLessons } from "../../hooks/useMyLessons";
import type { LessonItem } from "../../types/myLessons";
import { LessonCard } from "./LessonCard";
import { LessonCancellationDialog } from "./LessonCancellationDialog";

function LessonSection({
  title,
  items,
  onRequestCancellation,
  role,
}: {
  title: string;
  items: LessonItem[];
  role: UserRole;
  onRequestCancellation: (lesson: LessonItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-primary">{title}</h2>
      <div className="space-y-3">
        {items.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            role={role}
            onRequestCancellation={onRequestCancellation}
          />
        ))}
      </div>
    </div>
  );
}

export function MyLessonsTab({ role }: { role: UserRole }) {
  const t = useTranslations("settings.myLessons");
  const tc = useTranslations("common");
  const { lessons, loading, error, refresh } = useMyLessons(role);
  const [dialogLesson, setDialogLesson] = useState<LessonItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleOpenCancellationDialog(lesson: LessonItem) {
    setDialogLesson(lesson);
  }

  function handleCloseCancellationDialog() {
    if (submitting) return;
    setDialogLesson(null);
  }

  async function handleSubmitCancellation(payload: {
    bookingId: string;
    reason: string;
  }) {
    setSubmitting(true);

    try {
      const response = await fetch("/api/settings/lesson-cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        window.alert(data.error || t("requestSubmitFailed"));
        return;
      }

      setDialogLesson(null);
      refresh();
    } catch {
      window.alert(t("requestSubmitFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400">{tc("loading")}</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  const isEmpty =
    lessons.upcoming.length === 0 &&
    lessons.pending.length === 0 &&
    lessons.completed.length === 0 &&
    lessons.cancelled.length === 0;

  return (
    <>
      {isEmpty ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
          <p className="text-secondary">
            {role === "mentor" ? t("noLessonsBooked") : t("noLessonsYet")}
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
      ) : (
        <div className="space-y-8">
          <LessonSection
            title={t("upcoming")}
            items={lessons.upcoming}
            role={role}
            onRequestCancellation={handleOpenCancellationDialog}
          />
          <LessonSection
            title={t("pending")}
            items={lessons.pending}
            role={role}
            onRequestCancellation={handleOpenCancellationDialog}
          />
          <LessonSection
            title={t("completed")}
            items={lessons.completed}
            role={role}
            onRequestCancellation={handleOpenCancellationDialog}
          />
          <LessonSection
            title={t("cancelled")}
            items={lessons.cancelled}
            role={role}
            onRequestCancellation={handleOpenCancellationDialog}
          />
        </div>
      )}

      <LessonCancellationDialog
        lesson={dialogLesson}
        open={Boolean(dialogLesson)}
        role={role}
        submitting={submitting}
        onClose={handleCloseCancellationDialog}
        onSubmit={handleSubmitCancellation}
      />
    </>
  );
}
