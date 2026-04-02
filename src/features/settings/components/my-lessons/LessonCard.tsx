"use client";

import type { LessonItem } from "../../types/myLessons";
import type { BookingStatus } from "@/features/payment/types/payment";
import { ExternalLink } from "lucide-react";

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; text: string }
> = {
  confirmed: { label: "Upcoming", bg: "bg-blue-100", text: "text-blue-700" },
  pending: { label: "Pending", bg: "bg-yellow-100", text: "text-yellow-700" },
  completed: { label: "Completed", bg: "bg-green-100", text: "text-green-700" },
  expired: { label: "Expired", bg: "bg-gray-100", text: "text-gray-500" },
  cancelled: { label: "Cancelled", bg: "bg-red-100", text: "text-red-700" },
};

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

function formatMeetingProvider(provider: string | null): string {
  if (!provider) return "Meeting link";
  if (provider === "template") return "External meeting";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

type Props = {
  lesson: LessonItem;
};

export function LessonCard({ lesson }: Props) {
  const status = STATUS_CONFIG[lesson.status];
  const duration = formatDuration(lesson.startTime, lesson.endTime);
  const meetingProvider = formatMeetingProvider(lesson.meetingProvider);
  const shouldShowMeetingNote = lesson.status === "pending" || lesson.status === "confirmed";

  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-200">
          {lesson.participantAvatarUrl ? (
            <img
              src={lesson.participantAvatarUrl}
              alt={lesson.participantName}
              className="h-full w-full object-cover"
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
            {formatDate(lesson.startTime)} {formatTime(lesson.startTime)} –{" "}
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
            {status.label}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{meetingProvider}</p>
          {lesson.meetingUrl ? (
            <p className="text-xs text-secondary">
              Payment completed. The meeting link is ready.
            </p>
          ) : shouldShowMeetingNote ? (
            <p className="text-xs text-secondary">
              {lesson.status === "pending"
                ? "The meeting link will appear here once payment is confirmed."
                : "The meeting link is being prepared now."}
            </p>
          ) : (
            <p className="text-xs text-secondary">
              No meeting link was stored for this lesson.
            </p>
          )}
        </div>

        {lesson.meetingUrl ? (
          <a
            href={lesson.meetingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2563eb] bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
          >
            Open meeting
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
