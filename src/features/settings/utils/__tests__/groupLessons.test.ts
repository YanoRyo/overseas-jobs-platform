import { describe, expect, test } from "vitest";
import type { BookingStatus } from "@/features/bookings/types";
import type { LessonItem } from "../../types/myLessons";
import { groupLessons } from "../groupLessons";

function lesson(id: string, status: BookingStatus, startTime: string): LessonItem {
  const start = new Date(startTime);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 25);

  return {
    id,
    startTime: start,
    endTime: end,
    status,
    participantName: "Test User",
    participantAvatarUrl: null,
    participantLabel: "Mentor",
    mentorId: "mentor-id",
    mentorCountry: null,
    mentorHourlyRate: null,
    amount: null,
    currency: "usd",
    paymentStatus: null,
    refundAmount: null,
    refundedAt: null,
    meetingUrl: null,
    meetingProvider: null,
    changeRequest: null,
  };
}

describe("groupLessons", () => {
  test("keeps expired bookings separate from pending lessons", () => {
    const grouped = groupLessons([
      lesson("pending", "pending", "2026-04-21T01:00:00.000Z"),
      lesson("requested", "cancellation_requested", "2026-04-21T02:00:00.000Z"),
      lesson("expired", "expired", "2026-04-20T01:00:00.000Z"),
      lesson("confirmed", "confirmed", "2026-04-22T01:00:00.000Z"),
      lesson("completed", "completed", "2026-04-19T01:00:00.000Z"),
      lesson("cancelled", "cancelled", "2026-04-18T01:00:00.000Z"),
      lesson(
        "cancelled-by-mentor",
        "cancelled_by_mentor",
        "2026-04-17T01:00:00.000Z"
      ),
    ]);

    expect(grouped.upcoming.map((item) => item.id)).toEqual(["confirmed"]);
    expect(grouped.pending.map((item) => item.id)).toEqual([
      "pending",
      "requested",
    ]);
    expect(grouped.expired.map((item) => item.id)).toEqual(["expired"]);
    expect(grouped.completed.map((item) => item.id)).toEqual(["completed"]);
    expect(grouped.cancelled.map((item) => item.id)).toEqual([
      "cancelled",
      "cancelled-by-mentor",
    ]);
  });
});
