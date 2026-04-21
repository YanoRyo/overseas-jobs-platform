import type { MentorDetailModel } from "@/features/mentors/types";

export type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export type DateOnlyParts = {
  year: number;
  month: number;
  day: number;
};

export type WeeklySchedule = {
  rangeLabel: string;
  days: {
    key: string;
    dateLabel: string;
    weekdayLabel: string;
    times: string[];
  }[];
  hasAnySlots: boolean;
};

export const pad2 = (value: number) => value.toString().padStart(2, "0");

/**
 * Extracts date/time components from a Date object in the specified timezone.
 * Uses Intl.DateTimeFormat to convert a UTC-based Date to local timezone parts.
 * This approach avoids external libraries like date-fns-tz while maintaining accuracy.
 */
export const getZonedDateParts = (date: Date, timeZone: string): DateParts => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  ) as Record<string, string>;

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  };
};

/**
 * Calculates the UTC offset (in minutes) for a given timezone at a specific moment.
 * The offset can vary due to DST, so it must be computed for each specific date.
 * Returns positive values for timezones ahead of UTC (e.g., +540 for JST).
 */
const getTimeZoneOffset = (date: Date, timeZone: string) => {
  const parts = getZonedDateParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return Math.round((asUtc - date.getTime()) / 60000);
};

export const formatGmtOffset = (date: Date, timeZone: string): string => {
  const offsetMinutes = getTimeZoneOffset(date, timeZone);
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  const sign = offsetMinutes >= 0 ? "+" : "-";
  return `GMT ${sign}${hours}:${minutes.toString().padStart(2, "0")}`;
};

/**
 * Converts a local time (specified as date parts in a timezone) to a UTC Date object.
 * Used to convert mentor's availability times (stored in their local timezone)
 * to UTC for display in the viewer's timezone.
 */
export const zonedTimeToUtc = (parts: DateParts, timeZone: string) => {
  const utcGuess = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    )
  );
  const offsetMinutes = getTimeZoneOffset(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offsetMinutes * 60000);
};

export const addDaysToDateParts = (
  parts: DateOnlyParts,
  days: number
): DateOnlyParts => {
  const date = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + days)
  );
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

export const parseTimeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

export const zonedDateTimeToUtc = (
  dateKey: string,
  time: string,
  timeZone: string
): Date | null => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }

  return zonedTimeToUtc(
    { year, month, day, hour, minute, second: 0 },
    timeZone
  );
};

const toDateKey = (parts: DateOnlyParts) =>
  `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;

const groupEnabledAvailabilityByDay = (
  availability: MentorDetailModel["availability"]
) => {
  const availabilityByDay = new Map<number, typeof availability>();
  for (const slot of availability) {
    if (!slot.isEnabled) continue;
    const existing = availabilityByDay.get(slot.dayOfWeek);
    if (existing) {
      existing.push(slot);
    } else {
      availabilityByDay.set(slot.dayOfWeek, [slot]);
    }
  }
  return availabilityByDay;
};

export const buildWeeklySchedule = (
  availability: MentorDetailModel["availability"],
  mentorTimeZone: string,
  viewerTimeZone: string,
  weekStartParts: DateOnlyParts,
  dateLocale: string = "en-US",
  now: Date = new Date()
): WeeklySchedule => {
  const rangeEndParts = addDaysToDateParts(weekStartParts, 6);
  const rangeLabel =
    weekStartParts.year === rangeEndParts.year
      ? `${weekStartParts.month}/${weekStartParts.day} - ${rangeEndParts.month}/${rangeEndParts.day}, ${weekStartParts.year}`
      : `${weekStartParts.month}/${weekStartParts.day}, ${weekStartParts.year} - ${rangeEndParts.month}/${rangeEndParts.day}, ${rangeEndParts.year}`;

  const viewerStartUtc = zonedTimeToUtc(
    { ...weekStartParts, hour: 0, minute: 0, second: 0 },
    viewerTimeZone
  );
  const viewerEndUtc = zonedTimeToUtc(
    { ...addDaysToDateParts(weekStartParts, 7), hour: 0, minute: 0, second: 0 },
    viewerTimeZone
  );

  const mentorStartParts = getZonedDateParts(viewerStartUtc, mentorTimeZone);
  const mentorEndParts = getZonedDateParts(viewerEndUtc, mentorTimeZone);
  const scanStart = addDaysToDateParts(
    {
      year: mentorStartParts.year,
      month: mentorStartParts.month,
      day: mentorStartParts.day,
    },
    -1
  );
  const scanEnd = addDaysToDateParts(
    {
      year: mentorEndParts.year,
      month: mentorEndParts.month,
      day: mentorEndParts.day,
    },
    1
  );

  const days: WeeklySchedule["days"] = [];
  const scheduleMap = new Map<string, Set<string>>();
  const weekdayFormatter = new Intl.DateTimeFormat(dateLocale, {
    timeZone: viewerTimeZone,
    weekday: "short",
  });

  for (let i = 0; i < 7; i += 1) {
    const dayParts = addDaysToDateParts(weekStartParts, i);
    const key = toDateKey(dayParts);
    const dayUtc = zonedTimeToUtc(
      { ...dayParts, hour: 0, minute: 0, second: 0 },
      viewerTimeZone
    );
    days.push({
      key,
      dateLabel: `${dayParts.month}/${dayParts.day}`,
      weekdayLabel: weekdayFormatter.format(dayUtc),
      times: [],
    });
    scheduleMap.set(key, new Set());
  }

  const availabilityByDay = groupEnabledAvailabilityByDay(availability);
  const scanStartUtc = Date.UTC(
    scanStart.year,
    scanStart.month - 1,
    scanStart.day
  );
  const scanEndUtc = Date.UTC(scanEnd.year, scanEnd.month - 1, scanEnd.day);
  const totalScanDays = Math.round((scanEndUtc - scanStartUtc) / 86400000);

  for (let i = 0; i <= totalScanDays; i += 1) {
    const mentorDate = addDaysToDateParts(scanStart, i);
    const weekDay = new Date(
      Date.UTC(mentorDate.year, mentorDate.month - 1, mentorDate.day)
    ).getUTCDay();
    const slotsForDay = availabilityByDay.get(weekDay);
    if (!slotsForDay) continue;

    for (const slot of slotsForDay) {
      const startMinutes = parseTimeToMinutes(slot.startTime);
      const endMinutes = parseTimeToMinutes(slot.endTime);
      if (endMinutes <= startMinutes) continue;

      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const utcDate = zonedTimeToUtc(
          { ...mentorDate, hour, minute, second: 0 },
          mentorTimeZone
        );

        if (utcDate < viewerStartUtc || utcDate >= viewerEndUtc) continue;
        if (utcDate <= now) continue;

        const viewerParts = getZonedDateParts(utcDate, viewerTimeZone);
        const key = toDateKey({
          year: viewerParts.year,
          month: viewerParts.month,
          day: viewerParts.day,
        });
        const timeLabel = `${pad2(viewerParts.hour)}:${pad2(
          viewerParts.minute
        )}`;
        const daySet = scheduleMap.get(key);
        if (daySet) {
          daySet.add(timeLabel);
        }
      }
    }
  }

  let hasAnySlots = false;
  const sortedDays = days.map((day) => {
    const timeSet = scheduleMap.get(day.key);
    const times = timeSet ? Array.from(timeSet) : [];
    times.sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
    if (times.length > 0) {
      hasAnySlots = true;
    }
    return { ...day, times };
  });

  return {
    rangeLabel,
    days: sortedDays,
    hasAnySlots,
  };
};

type AvailableSlotsParams = {
  availability: MentorDetailModel["availability"];
  mentorTimeZone: string;
  viewerTimeZone: string;
  viewerDateParts: DateOnlyParts;
  lessonDuration: number;
  now?: Date;
};

export const buildAvailableSlotsForViewerDate = ({
  availability,
  mentorTimeZone,
  viewerTimeZone,
  viewerDateParts,
  lessonDuration,
  now = new Date(),
}: AvailableSlotsParams): string[] => {
  const viewerStartUtc = zonedTimeToUtc(
    { ...viewerDateParts, hour: 0, minute: 0, second: 0 },
    viewerTimeZone
  );
  const viewerEndUtc = zonedTimeToUtc(
    { ...addDaysToDateParts(viewerDateParts, 1), hour: 0, minute: 0, second: 0 },
    viewerTimeZone
  );

  const mentorStartParts = getZonedDateParts(viewerStartUtc, mentorTimeZone);
  const mentorEndParts = getZonedDateParts(viewerEndUtc, mentorTimeZone);
  const scanStart = addDaysToDateParts(
    {
      year: mentorStartParts.year,
      month: mentorStartParts.month,
      day: mentorStartParts.day,
    },
    -1
  );
  const scanEnd = addDaysToDateParts(
    {
      year: mentorEndParts.year,
      month: mentorEndParts.month,
      day: mentorEndParts.day,
    },
    1
  );

  const availabilityByDay = groupEnabledAvailabilityByDay(availability);
  const times = new Set<string>();
  const scanStartUtc = Date.UTC(
    scanStart.year,
    scanStart.month - 1,
    scanStart.day
  );
  const scanEndUtc = Date.UTC(scanEnd.year, scanEnd.month - 1, scanEnd.day);
  const totalScanDays = Math.round((scanEndUtc - scanStartUtc) / 86400000);

  for (let i = 0; i <= totalScanDays; i += 1) {
    const mentorDate = addDaysToDateParts(scanStart, i);
    const weekDay = new Date(
      Date.UTC(mentorDate.year, mentorDate.month - 1, mentorDate.day)
    ).getUTCDay();
    const slotsForDay = availabilityByDay.get(weekDay);
    if (!slotsForDay) continue;

    for (const slot of slotsForDay) {
      const startMinutes = parseTimeToMinutes(slot.startTime);
      const endMinutes = parseTimeToMinutes(slot.endTime);
      if (endMinutes <= startMinutes) continue;

      for (
        let minutes = startMinutes;
        minutes + lessonDuration <= endMinutes;
        minutes += 30
      ) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const utcDate = zonedTimeToUtc(
          { ...mentorDate, hour, minute, second: 0 },
          mentorTimeZone
        );

        if (utcDate < viewerStartUtc || utcDate >= viewerEndUtc) continue;
        if (utcDate <= now) continue;

        const viewerParts = getZonedDateParts(utcDate, viewerTimeZone);
        times.add(`${pad2(viewerParts.hour)}:${pad2(viewerParts.minute)}`);
      }
    }
  }

  return Array.from(times).sort(
    (a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b)
  );
};
