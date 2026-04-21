import { describe, expect, test } from "vitest";
import type { MentorDetailModel } from "@/features/mentors/types";
import {
  buildWeeklySchedule,
  buildAvailableSlotsForViewerDate,
  formatGmtOffset,
  zonedDateTimeToUtc,
} from "../scheduleTimezone";

const availability = (
  slots: MentorDetailModel["availability"]
): MentorDetailModel["availability"] => slots;

describe("schedule timezone utilities", () => {
  test("moves mentor availability onto the viewer's local date when timezones cross midnight", () => {
    const slots = buildAvailableSlotsForViewerDate({
      availability: availability([
        {
          dayOfWeek: 1,
          startTime: "00:30",
          endTime: "01:30",
          isEnabled: true,
        },
      ]),
      mentorTimeZone: "Asia/Tokyo",
      viewerTimeZone: "America/Los_Angeles",
      viewerDateParts: { year: 2026, month: 4, day: 5 },
      lessonDuration: 25,
      now: new Date("2026-04-01T00:00:00Z"),
    });

    expect(slots).toEqual(["08:30", "09:00"]);
  });

  test("does not show a shifted slot on the mentor's original weekday in the viewer timezone", () => {
    const slots = buildAvailableSlotsForViewerDate({
      availability: availability([
        {
          dayOfWeek: 1,
          startTime: "00:30",
          endTime: "01:30",
          isEnabled: true,
        },
      ]),
      mentorTimeZone: "Asia/Tokyo",
      viewerTimeZone: "America/Los_Angeles",
      viewerDateParts: { year: 2026, month: 4, day: 6 },
      lessonDuration: 25,
      now: new Date("2026-04-01T00:00:00Z"),
    });

    expect(slots).toEqual([]);
  });

  test("filters out starts that cannot fit the selected lesson duration", () => {
    const slots = buildAvailableSlotsForViewerDate({
      availability: availability([
        {
          dayOfWeek: 2,
          startTime: "09:00",
          endTime: "09:30",
          isEnabled: true,
        },
      ]),
      mentorTimeZone: "Asia/Tokyo",
      viewerTimeZone: "Asia/Tokyo",
      viewerDateParts: { year: 2026, month: 4, day: 7 },
      lessonDuration: 50,
      now: new Date("2026-04-01T00:00:00Z"),
    });

    expect(slots).toEqual([]);
  });

  test("formats timezone offsets without leaking milliseconds", () => {
    expect(
      formatGmtOffset(new Date("2026-04-01T00:00:00.123Z"), "Asia/Tokyo")
    ).toBe("GMT +9:00");
  });

  test("filters past starts from weekly schedules", () => {
    const schedule = buildWeeklySchedule(
      availability([
        {
          dayOfWeek: 2,
          startTime: "09:00",
          endTime: "10:00",
          isEnabled: true,
        },
      ]),
      "Asia/Tokyo",
      "Asia/Tokyo",
      { year: 2026, month: 4, day: 5 },
      "en-US",
      new Date("2026-04-07T00:15:00Z")
    );

    expect(schedule.days.find((day) => day.key === "2026-04-07")?.times).toEqual([
      "09:30",
    ]);
  });

  test("converts schedule date keys and times using the selected timezone", () => {
    expect(
      zonedDateTimeToUtc(
        "2026-04-06",
        "00:30",
        "Asia/Tokyo"
      )?.toISOString()
    ).toBe("2026-04-05T15:30:00.000Z");
  });
});
