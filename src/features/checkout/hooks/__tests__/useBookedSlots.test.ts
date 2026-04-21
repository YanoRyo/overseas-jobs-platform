import { describe, expect, test } from "vitest";
import { isBookedSlotOverlapping, type BookedSlot } from "../useBookedSlots";

const bookedSlot = (
  startTime: string,
  endTime: string,
  ownPending: boolean
): BookedSlot => ({
  startTime: new Date(startTime),
  endTime: new Date(endTime),
  ownPending,
});

describe("isBookedSlotOverlapping", () => {
  test("allows the current user's exact pending hold to be selected again", () => {
    const booking = bookedSlot(
      "2026-04-21T01:00:00.000Z",
      "2026-04-21T01:25:00.000Z",
      true
    );

    expect(
      isBookedSlotOverlapping(
        booking,
        new Date("2026-04-21T01:00:00.000Z"),
        25
      )
    ).toBe(false);
  });

  test("still blocks the current user's pending hold when the duration overlaps differently", () => {
    const booking = bookedSlot(
      "2026-04-21T01:00:00.000Z",
      "2026-04-21T01:25:00.000Z",
      true
    );

    expect(
      isBookedSlotOverlapping(
        booking,
        new Date("2026-04-21T01:00:00.000Z"),
        50
      )
    ).toBe(true);
  });

  test("blocks another user's pending hold", () => {
    const booking = bookedSlot(
      "2026-04-21T01:00:00.000Z",
      "2026-04-21T01:25:00.000Z",
      false
    );

    expect(
      isBookedSlotOverlapping(
        booking,
        new Date("2026-04-21T01:00:00.000Z"),
        25
      )
    ).toBe(true);
  });
});
