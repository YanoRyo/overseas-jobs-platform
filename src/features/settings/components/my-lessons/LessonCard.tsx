"use client";

import type { LessonItem } from "../../types/myLessons";
import type { BookingStatus } from "@/features/payment/types/payment";

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

type Props = {
  lesson: LessonItem;
};

export function LessonCard({ lesson }: Props) {
  const status = STATUS_CONFIG[lesson.status];
  const duration = formatDuration(lesson.startTime, lesson.endTime);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
      {/* アバター */}
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-200">
        {lesson.mentorAvatarUrl ? (
          <img
            src={lesson.mentorAvatarUrl}
            alt={lesson.mentorName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600">
            {lesson.mentorName.charAt(0)}
          </div>
        )}
      </div>

      {/* メンター名・日時 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-primary">
          {lesson.mentorName}
        </p>
        <p className="mt-0.5 text-sm text-secondary">
          {formatDate(lesson.startTime)} {formatTime(lesson.startTime)} –{" "}
          {formatTime(lesson.endTime)} ({duration}min)
        </p>
      </div>

      {/* 金額 */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-medium text-primary">
          {formatAmount(lesson.amount, lesson.currency)}
        </p>
      </div>

      {/* ステータスバッジ */}
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
      >
        {status.label}
      </span>
    </div>
  );
}
