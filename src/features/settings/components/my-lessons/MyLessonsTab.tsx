"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import type { UserRole } from "@/features/auth/types";
import type { ReservationData } from "@/features/checkout/types/reservation";
import { useMyLessons } from "../../hooks/useMyLessons";
import type { LessonItem } from "../../types/myLessons";
import { LessonCard } from "./LessonCard";
import { LessonCancellationDialog } from "./LessonCancellationDialog";

function LessonSection({
  title,
  items,
  onRequestCancellation,
  onResumePayment,
  role,
}: {
  title: string;
  items: LessonItem[];
  role: UserRole;
  onRequestCancellation: (lesson: LessonItem) => void;
  onResumePayment: (lesson: LessonItem) => void;
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
            onResumePayment={onResumePayment}
          />
        ))}
      </div>
    </div>
  );
}

export function MyLessonsTab({ role }: { role: UserRole }) {
  const t = useTranslations("settings.myLessons");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
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

  function handleResumePayment(lesson: LessonItem) {
    const duration = Math.round(
      (lesson.endTime.getTime() - lesson.startTime.getTime()) / (1000 * 60)
    );
    const time = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(lesson.startTime);
    const hourlyRate =
      lesson.mentorHourlyRate ??
      (lesson.amount !== null && duration > 0
        ? lesson.amount / 100 / (duration / 60)
        : 0);

    const reservation: ReservationData = {
      bookingId: lesson.id,
      mentorId: lesson.mentorId,
      mentorName: lesson.participantName,
      mentorAvatarUrl: lesson.participantAvatarUrl ?? "",
      mentorCountry: lesson.mentorCountry ?? "",
      hourlyRate,
      duration,
      date: lesson.startTime.toISOString(),
      time,
    };

    localStorage.setItem("pendingReservation", JSON.stringify(reservation));
    router.push("/checkout");
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
            onResumePayment={handleResumePayment}
          />
          <LessonSection
            title={t("pending")}
            items={lessons.pending}
            role={role}
            onRequestCancellation={handleOpenCancellationDialog}
            onResumePayment={handleResumePayment}
          />
          <LessonSection
            title={t("completed")}
            items={lessons.completed}
            role={role}
            onRequestCancellation={handleOpenCancellationDialog}
            onResumePayment={handleResumePayment}
          />
          <LessonSection
            title={t("cancelled")}
            items={lessons.cancelled}
            role={role}
            onRequestCancellation={handleOpenCancellationDialog}
            onResumePayment={handleResumePayment}
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
