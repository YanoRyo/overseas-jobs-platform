"use client";

import Link from "next/link";
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
  const { lessons, loading, error } = useMyLessons(role);

  if (loading) {
    return <p className="text-sm text-gray-400">Loading...</p>;
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
            ? "予約されたレッスンはまだありません"
            : "レッスンの予約はまだありません"}
        </p>
        {role === "student" ? (
          <Link
            href="/"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            メンターを探す
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <LessonSection title="Upcoming" items={lessons.upcoming} />
      <LessonSection title="Pending" items={lessons.pending} />
      <LessonSection title="Completed" items={lessons.completed} />
    </div>
  );
}
