"use client";

import { useEffect, useState } from "react";
import type { LessonItem, GroupedLessons } from "../types/myLessons";
import type { UserRole } from "@/features/auth/types";

type ApiLessonItem = {
  id: string;
  startTime: string;
  endTime: string;
  status: LessonItem["status"];
  participantName: string;
  participantAvatarUrl: string | null;
  participantLabel: LessonItem["participantLabel"];
  amount: number | null;
  currency: string;
  paymentStatus: LessonItem["paymentStatus"];
  meetingUrl: string | null;
  meetingProvider: string | null;
};

function groupLessons(items: LessonItem[]): GroupedLessons {
  const upcoming: LessonItem[] = [];
  const pending: LessonItem[] = [];
  const completed: LessonItem[] = [];

  for (const item of items) {
    switch (item.status) {
      case "confirmed":
        upcoming.push(item);
        break;
      case "pending":
        pending.push(item);
        break;
      case "completed":
        completed.push(item);
        break;
    }
  }

  upcoming.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  pending.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  completed.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  return { upcoming, pending, completed };
}

function parseUtcTimestamp(value: string) {
  return new Date(value.endsWith("Z") ? value : `${value}Z`);
}

export function useMyLessons(role: UserRole) {
  const [lessons, setLessons] = useState<GroupedLessons>({
    upcoming: [],
    pending: [],
    completed: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchLessons = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/settings/my-lessons?role=${role}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch lessons: ${response.status}`);
        }

        const data = (await response.json()) as { lessons?: ApiLessonItem[] };
        const items: LessonItem[] = (data.lessons ?? []).map((lesson) => ({
          id: lesson.id,
          startTime: parseUtcTimestamp(lesson.startTime),
          endTime: parseUtcTimestamp(lesson.endTime),
          status: lesson.status,
          participantName: lesson.participantName,
          participantAvatarUrl: lesson.participantAvatarUrl,
          participantLabel: lesson.participantLabel,
          amount: lesson.amount,
          currency: lesson.currency,
          paymentStatus: lesson.paymentStatus,
          meetingUrl: lesson.meetingUrl,
          meetingProvider: lesson.meetingProvider,
        }));

        if (!cancelled) {
          setLessons(groupLessons(items));
        }
      } catch (fetchError) {
        console.error("Failed to load lessons:", fetchError);
        if (!cancelled) {
          setLessons({ upcoming: [], pending: [], completed: [] });
          setError("Failed to load lesson information.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchLessons();

    return () => {
      cancelled = true;
    };
  }, [role]);

  return { lessons, loading, error };
}
