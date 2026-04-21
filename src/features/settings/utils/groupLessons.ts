import type { GroupedLessons, LessonItem } from "../types/myLessons";

export function groupLessons(items: LessonItem[]): GroupedLessons {
  const upcoming: LessonItem[] = [];
  const pending: LessonItem[] = [];
  const expired: LessonItem[] = [];
  const completed: LessonItem[] = [];
  const cancelled: LessonItem[] = [];

  for (const item of items) {
    switch (item.status) {
      case "confirmed":
        upcoming.push(item);
        break;
      case "pending":
      case "cancellation_requested":
        pending.push(item);
        break;
      case "expired":
        expired.push(item);
        break;
      case "completed":
        completed.push(item);
        break;
      case "cancelled":
      case "cancelled_by_mentor":
        cancelled.push(item);
        break;
    }
  }

  upcoming.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  pending.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  expired.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  completed.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  cancelled.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  return { upcoming, pending, expired, completed, cancelled };
}
