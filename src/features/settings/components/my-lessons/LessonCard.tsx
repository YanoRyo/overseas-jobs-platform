"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import type { UserRole } from "@/features/auth/types";
import type { BookingStatus } from "@/features/payment/types/payment";
import type { LessonItem } from "../../types/myLessons";

const STATUS_STYLES: Record<BookingStatus, { bg: string; text: string }> = {
  confirmed: { bg: "bg-blue-100", text: "text-blue-700" },
  cancellation_requested: { bg: "bg-amber-100", text: "text-amber-800" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
  completed: { bg: "bg-green-100", text: "text-green-700" },
  expired: { bg: "bg-gray-100", text: "text-gray-500" },
  cancelled: { bg: "bg-red-100", text: "text-red-700" },
  cancelled_by_mentor: { bg: "bg-rose-100", text: "text-rose-700" },
};

type LessonsTranslator = (
  key: string,
  values?: Record<string, string | number>
) => string;

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDuration(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

function formatAmount(amount: number | null, currency: string): string {
  if (amount === null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

function formatMeetingProvider(
  provider: string | null,
  t: LessonsTranslator
): string {
  if (!provider) return t("meetingLink");
  if (provider === "template") return t("externalMeeting");
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function getStatusLabel(
  status: BookingStatus,
  t: LessonsTranslator
) {
  switch (status) {
    case "confirmed":
      return t("upcoming");
    case "cancellation_requested":
      return t("cancellationRequested");
    case "pending":
      return t("pending");
    case "completed":
      return t("completed");
    case "expired":
      return t("expired");
    case "cancelled":
      return t("cancelled");
    case "cancelled_by_mentor":
      return t("cancelledByMentor");
  }
}

type Props = {
  lesson: LessonItem;
  role: UserRole;
  onRequestCancellation: (lesson: LessonItem) => void;
};

export function LessonCard({ lesson, role, onRequestCancellation }: Props) {
  const t = useTranslations("settings.myLessons");
  const status = STATUS_STYLES[lesson.status];
  const duration = formatDuration(lesson.startTime, lesson.endTime);
  const meetingProvider = formatMeetingProvider(lesson.meetingProvider, t);
  const shouldShowMeetingNote =
    lesson.status === "pending" || lesson.status === "confirmed";
  const pendingRequest =
    lesson.changeRequest?.status === "pending" ? lesson.changeRequest : null;
  const latestRequest = lesson.changeRequest;
  const canCancel =
    (lesson.status === "pending" ||
      lesson.status === "confirmed" ||
      (role === "mentor" && lesson.status === "cancellation_requested")) &&
    !(role === "student" && pendingRequest);
  const shouldShowMeetingButton =
    Boolean(lesson.meetingUrl) &&
    lesson.status !== "cancelled" &&
    lesson.status !== "cancelled_by_mentor" &&
    lesson.status !== "cancellation_requested" &&
    lesson.paymentStatus !== "refunded" &&
    lesson.paymentStatus !== "refund_pending";

  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-200">
          {lesson.participantAvatarUrl ? (
            <Image
              src={lesson.participantAvatarUrl}
              alt={lesson.participantName}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600">
              {lesson.participantName.charAt(0)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-secondary">
            {lesson.participantLabel}
          </p>
          <p className="truncate text-base font-semibold text-primary">
            {lesson.participantName}
          </p>
          <p className="mt-0.5 text-sm text-secondary">
            {formatDate(lesson.startTime)} {formatTime(lesson.startTime)} -{" "}
            {formatTime(lesson.endTime)} ({duration}min)
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 sm:block sm:shrink-0 sm:text-right">
          <p className="text-sm font-medium text-primary">
            {formatAmount(lesson.amount, lesson.currency)}
          </p>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
          >
            {getStatusLabel(lesson.status, t)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{meetingProvider}</p>
          {lesson.paymentStatus === "refunded" ? (
            <p className="text-xs text-secondary">
              {lesson.refundAmount != null
                ? t("paymentRefundedWithAmount", {
                    amount: formatAmount(lesson.refundAmount, lesson.currency),
                  })
                : t("paymentRefunded")}
            </p>
          ) : lesson.paymentStatus === "refund_pending" ? (
            <p className="text-xs text-secondary">{t("paymentRefundPending")}</p>
          ) : lesson.status === "cancellation_requested" ? (
            <p className="text-xs text-secondary">
              {t("cancellationRequestPendingDetail")}
            </p>
          ) : lesson.status === "cancelled" ? (
            <p className="text-xs text-secondary">{t("lessonCancelledNote")}</p>
          ) : lesson.status === "cancelled_by_mentor" ? (
            <p className="text-xs text-secondary">
              {t("lessonCancelledByMentorNote")}
            </p>
          ) : lesson.meetingUrl ? (
            <p className="text-xs text-secondary">{t("linkReady")}</p>
          ) : shouldShowMeetingNote ? (
            <p className="text-xs text-secondary">
              {lesson.status === "pending" ? t("linkPending") : t("linkPreparing")}
            </p>
          ) : (
            <p className="text-xs text-secondary">{t("noLink")}</p>
          )}

          {pendingRequest ? (
            <p className="mt-2 text-xs font-medium text-[#92400e]">
              {t("cancellationRequestPending")}
            </p>
          ) : latestRequest?.status === "rejected" ? (
            <p className="mt-2 text-xs text-[#7c2d12]">
              {t("changeRequestRejected")}
              {latestRequest.reviewNote ? ` ${latestRequest.reviewNote}` : ""}
            </p>
          ) : latestRequest?.status === "approved" ? (
            <p className="mt-2 text-xs text-[#166534]">
              {t("cancellationRequestApproved")}
            </p>
          ) : null}

          {canCancel ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onRequestCancellation(lesson)}
                className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-3 py-1.5 text-xs font-medium text-[#be123c] transition hover:bg-[#ffe4e6]"
              >
                {role === "mentor" ? t("cancelLesson") : t("requestCancellation")}
              </button>
            </div>
          ) : null}
        </div>

        {shouldShowMeetingButton ? (
          <a
            href={lesson.meetingUrl ?? undefined}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2563eb] bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
          >
            {t("openMeeting")}
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>
    </div>
  );
}
