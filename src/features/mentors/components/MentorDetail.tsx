"use client";

import { useMemo, useState } from "react";
import Flag from "react-world-flags";
import { ChevronLeft, ChevronRight, ChevronDown, Info, Zap } from "lucide-react";
import BookingModal from "@/components/BookingModal";
import { MentorDetailModel } from "../types";
import { SendMessageModal } from "@/features/messages/components/SendMessageModal";
import { COUNTRIES, TIMEZONE_OPTIONS } from "@/features/mentor/constants/options";

type Props = {
  mentor: MentorDetailModel;
  isBookingOpen: boolean;
  onOpenBooking: () => void;
  onCloseBooking: () => void;
};

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

type DateOnlyParts = {
  year: number;
  month: number;
  day: number;
};

type WeeklySchedule = {
  rangeLabel: string;
  days: {
    key: string;
    dateLabel: string;
    weekdayLabel: string;
    times: string[];
  }[];
  hasAnySlots: boolean;
};

const LANGUAGE_LEVEL_LABELS: Record<string, string> = {
  native: "Native",
  c2: "C2",
  c1: "C1",
  b2: "Upper Intermediate B2",
  b1: "Intermediate B1",
  a2: "Elementary A2",
  a1: "Beginner A1",
};

const DEGREE_TYPE_LABELS: Record<string, string> = {
  associate: "Associate Degree",
  bachelor: "Bachelor's Degree",
  master: "Master's Degree",
  doctorate: "Doctorate",
  diploma: "Diploma / Certificate",
};

const pad2 = (value: number) => value.toString().padStart(2, "0");

/**
 * Extracts date/time components from a Date object in the specified timezone.
 * Uses Intl.DateTimeFormat to convert a UTC-based Date to local timezone parts.
 * This approach avoids external libraries like date-fns-tz while maintaining accuracy.
 */
const getZonedDateParts = (date: Date, timeZone: string): DateParts => {
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
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
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
  return (asUtc - date.getTime()) / 60000;
};

/**
 * Converts a local time (specified as date parts in a timezone) to a UTC Date object.
 * Used to convert mentor's availability times (stored in their local timezone)
 * to UTC for display in the viewer's timezone.
 */
const zonedTimeToUtc = (parts: DateParts, timeZone: string) => {
  const utcGuess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  );
  const offsetMinutes = getTimeZoneOffset(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offsetMinutes * 60000);
};

const addDaysToDateParts = (parts: DateOnlyParts, days: number): DateOnlyParts => {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

const parseTimeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const buildWeeklySchedule = (
  availability: MentorDetailModel["availability"],
  mentorTimeZone: string,
  viewerTimeZone: string,
  weekStartParts: DateOnlyParts
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
    { year: mentorStartParts.year, month: mentorStartParts.month, day: mentorStartParts.day },
    -1
  );
  const scanEnd = addDaysToDateParts(
    { year: mentorEndParts.year, month: mentorEndParts.month, day: mentorEndParts.day },
    1
  );

  const days: WeeklySchedule["days"] = [];
  const scheduleMap = new Map<string, Set<string>>();
  const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: viewerTimeZone,
    weekday: "short",
  });

  for (let i = 0; i < 7; i += 1) {
    const dayParts = addDaysToDateParts(weekStartParts, i);
    const key = `${dayParts.year}-${pad2(dayParts.month)}-${pad2(dayParts.day)}`;
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

  // Pre-group availability by dayOfWeek to avoid repeated filtering
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

  const scanStartUtc = Date.UTC(scanStart.year, scanStart.month - 1, scanStart.day);
  const scanEndUtc = Date.UTC(scanEnd.year, scanEnd.month - 1, scanEnd.day);
  const totalScanDays = Math.round((scanEndUtc - scanStartUtc) / 86400000);

  for (let i = 0; i <= totalScanDays; i += 1) {
    const mentorDate = addDaysToDateParts(scanStart, i);
    const weekDay = new Date(Date.UTC(mentorDate.year, mentorDate.month - 1, mentorDate.day)).getUTCDay();
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

        const viewerParts = getZonedDateParts(utcDate, viewerTimeZone);
        const key = `${viewerParts.year}-${pad2(viewerParts.month)}-${pad2(viewerParts.day)}`;
        const timeLabel = `${pad2(viewerParts.hour)}:${pad2(viewerParts.minute)}`;
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

export const MentorDetail = ({
  mentor,
  isBookingOpen,
  onOpenBooking,
  onCloseBooking,
}: Props) => {
  const [bioExpanded, setBioExpanded] = useState(false);
  const [reviewExpanded, setReviewExpanded] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const [openSpecialtyIndex, setOpenSpecialtyIndex] = useState<number | null>(null);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [activeCareerTab, setActiveCareerTab] = useState<"education" | "work" | "certificate">(
    "education"
  );
  const [selectedTimezone, setSelectedTimezone] = useState(
    mentor.timezone || "Asia/Tokyo"
  );
  const [weekOffset, setWeekOffset] = useState(0);
  const isPrevWeekDisabled = weekOffset <= 0;

  const countryName = useMemo(() => {
    const match = COUNTRIES.find((country) => country.code === mentor.country);
    return match?.name ?? mentor.country;
  }, [mentor.country]);

  // Memoize weekStartParts to ensure stable reference for weeklySchedule dependency
  const weekStartParts = useMemo(() => {
    const baseDateParts = getZonedDateParts(new Date(), selectedTimezone);
    return addDaysToDateParts(
      { year: baseDateParts.year, month: baseDateParts.month, day: baseDateParts.day },
      weekOffset * 7
    );
  }, [selectedTimezone, weekOffset]);

  const weeklySchedule = useMemo(
    () =>
      buildWeeklySchedule(
        mentor.availability,
        mentor.timezone,
        selectedTimezone,
        weekStartParts
      ),
    [mentor.availability, mentor.timezone, selectedTimezone, weekStartParts]
  );

  const displayedReviews = reviewExpanded ? mentor.reviews : mentor.reviews.slice(0, 4);
  const languageList =
    mentor.spokenLanguages.length > 0 ? mentor.spokenLanguages : [{ name: "Not registered", level: "" }];

  return (
    <div className="bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
          {/* ================= Left Column ================= */}
          <div className="space-y-8">
            {/* Profile */}
            <section className="pb-8 border-b border-border last:border-b-0 last:pb-0">
              <div className="flex flex-col gap-6 sm:flex-row">
                <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0">
                  {mentor.avatarUrl ? (
                    <img
                      src={mentor.avatarUrl}
                      alt={mentor.name}
                      className="w-full h-full object-cover rounded-2xl shadow-sm"
                    />
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-slate-100 border border-border" />
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <h1 className="text-3xl font-semibold text-primary">{mentor.name}</h1>
                    {/* Subtitle: "From {countryName}" */}
                    <p className="mt-1 text-secondary flex items-center gap-2">
                      From {countryName}
                      <Flag code={mentor.country} className="w-6 h-4 rounded-sm" />
                    </p>
                  </div>
                  {/* Introduction: Simple text without box decoration */}
                  {mentor.intro && (
                    <p className="text-secondary leading-relaxed">{mentor.intro}</p>
                  )}
                  {/* Subjects: Inline format */}
                  <p className="text-sm text-secondary">
                    <span className="font-semibold text-primary">Subjects: </span>
                    {mentor.subjects.length === 0
                      ? "Not registered"
                      : mentor.subjects.join(", ")}
                  </p>
                </div>
              </div>
            </section>

            {/* About Me */}
            <section className="pb-8 border-b border-border last:border-b-0 last:pb-0">
              <h2 className="text-xl font-semibold text-primary">About Me</h2>
              <p
                className={`mt-4 text-secondary whitespace-pre-wrap leading-relaxed ${
                  bioExpanded ? "" : "line-clamp-6"
                }`}
              >
                {mentor.bio}
              </p>
              {mentor.bio.length > 200 && (
                <button
                  type="button"
                  onClick={() => setBioExpanded((prev) => !prev)}
                  className="mt-3 text-accent hover:underline text-sm font-medium"
                >
                  {bioExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </section>

            {/* Languages */}
            <section className="pb-8 border-b border-border last:border-b-0 last:pb-0">
              <h2 className="text-xl font-semibold text-primary">Languages</h2>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                {languageList.map((lang, idx) => (
                  <span
                    key={`${lang.name}-${idx}`}
                    className="inline-flex items-center gap-2 text-sm text-primary"
                  >
                    {lang.name}
                    {lang.level && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm font-medium">
                        {LANGUAGE_LEVEL_LABELS[lang.level] ?? lang.level.toUpperCase()}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </section>

            {/* Student Reviews */}
            <section className="pb-8 border-b border-border last:border-b-0 last:pb-0">
              {/* Header: "Student Reviews" + Info icon with tooltip */}
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-primary">Student Reviews</h2>
                <div className="relative group">
                  <Info className="w-4 h-4 text-muted cursor-help" />
                  {/* Tooltip with arrow pointing to icon */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 w-64">
                      Only reviews from students who have taken lessons with this tutor are posted. See our{" "}
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-blue-400 hover:underline"
                      >
                        Terms of Service
                      </a>{" "}
                      for details.
                    </div>
                    {/* Arrow pointing down to icon */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -bottom-1.5"
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop: "6px solid rgb(17, 24, 39)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Rating display: Below header */}
              <div className="flex items-center gap-3 mt-3">
                <span className="text-4xl font-bold text-primary">{mentor.rating}</span>
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100">
                  <span className="text-yellow-500 text-xl">★</span>
                </span>
                <p className="text-sm text-muted">
                  Based on {mentor.reviewCount} student reviews
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedReviews.length === 0 ? (
                  <p className="text-sm text-muted">No reviews yet.</p>
                ) : (
                  displayedReviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-xl border border-border bg-white p-4 shadow-sm"
                    >
                      {/* Review card: Avatar + Name + Date inline */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                          {review.author.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-primary">{review.author}</p>
                            <span className="text-xs text-muted">
                              {new Date(review.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          {/* Star rating below name */}
                          <div className="text-yellow-500 text-sm">
                            {"★".repeat(Math.round(review.rating))}
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-secondary leading-relaxed">
                        {review.comment || "No comment provided."}
                      </p>
                    </article>
                  ))
                )}
              </div>

              {mentor.reviews.length > 4 && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setReviewExpanded((prev) => !prev)}
                    className="px-6 py-2 border border-border rounded-full text-sm text-primary hover:bg-surface-hover transition"
                  >
                    {reviewExpanded ? "Show less" : `Show all ${mentor.reviewCount} reviews`}
                  </button>
                </div>
              )}
            </section>

            {/* Schedule */}
            <section className="pb-8 border-b border-border last:border-b-0 last:pb-0">
              <h2 className="text-xl font-semibold text-primary">Schedule</h2>

              {scheduleOpen && (
                <>
                  {/* Info box: Gray background */}
                  <div className="mt-4 flex items-start gap-3 rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Select a time for your first lesson. Times are shown in your timezone.
                    </p>
                  </div>

                  <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (isPrevWeekDisabled) return;
                          setWeekOffset((prev) => Math.max(0, prev - 1));
                        }}
                        disabled={isPrevWeekDisabled}
                        className={`rounded-full border border-border p-2 transition ${
                          isPrevWeekDisabled
                            ? "text-muted/50 cursor-not-allowed"
                            : "text-muted hover:text-primary hover:border-border-hover"
                        }`}
                        aria-label="Previous week"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setWeekOffset((prev) => prev + 1)}
                        className="rounded-full border border-border p-2 text-muted hover:text-primary hover:border-border-hover transition"
                        aria-label="Next week"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium text-primary">
                        {weeklySchedule.rangeLabel}
                      </span>
                    </div>

                    {/* Timezone selector with GMT offset */}
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <select
                        id="timezone"
                        value={selectedTimezone}
                        onChange={(event) => {
                          setSelectedTimezone(event.target.value);
                          setWeekOffset(0);
                        }}
                        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        {TIMEZONE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label} / GMT {option.offset}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <div className="min-w-[640px] grid grid-cols-7 gap-4">
                      {weeklySchedule.days.map((day, index) => (
                        <div key={day.key} className="space-y-3">
                          {/* Color bar: Blue to gray */}
                          <div
                            className={`h-1 rounded-full ${
                              day.times.length > 0 ? "bg-accent" : "bg-gray-200"
                            }`}
                          />
                          <div className="text-center">
                            <p className="text-sm text-muted">{day.weekdayLabel}</p>
                            <p className="text-sm font-semibold text-primary">
                              {day.dateLabel}
                            </p>
                          </div>
                          <div className="space-y-2 text-center">
                            {day.times.length === 0 ? (
                              <p className="text-xs text-muted">-</p>
                            ) : (
                              day.times.map((time) => (
                                <a
                                  key={`${day.key}-${time}`}
                                  href="#"
                                  onClick={(event) => event.preventDefault()}
                                  className="block text-sm text-primary underline underline-offset-4 hover:text-accent"
                                >
                                  {time}
                                </a>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!weeklySchedule.hasAnySlots && (
                    <p className="mt-4 text-sm text-muted">
                      No available times currently.
                    </p>
                  )}
                </>
              )}

              {/* "Show full schedule" button at bottom center */}
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setScheduleOpen((prev) => !prev)}
                  className="px-6 py-2 border border-border rounded-full text-sm text-primary hover:bg-surface-hover transition"
                >
                  {scheduleOpen ? "Hide schedule" : "Show full schedule"}
                </button>
              </div>
            </section>

            {/* Resume */}
            <section className="pb-8 border-b border-border last:border-b-0 last:pb-0">
              <h2 className="text-xl font-semibold text-primary">Resume</h2>
              {/* 3 tabs: Education, Work Experience, Certificates */}
              <div className="mt-4 flex gap-2">
                {[
                  { id: "education", label: "Education" },
                  { id: "work", label: "Work Experience" },
                  { id: "certificate", label: "Certificates" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCareerTab(tab.id as "education" | "work" | "certificate")}
                    className={`px-4 py-2 text-sm font-semibold rounded-full transition ${
                      activeCareerTab === tab.id
                        ? "bg-gray-100 text-primary"
                        : "text-muted hover:text-primary hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-4 text-sm text-secondary leading-relaxed">
                {activeCareerTab === "education" ? (
                  mentor.hasNoDegree ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-primary">No Degree</p>
                      <p className="text-sm text-muted">No education information registered.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-primary">
                        {mentor.university || "University not registered"}
                      </p>
                      <p className="text-sm text-secondary">
                        {mentor.degree || "Degree not registered"}
                        {mentor.degreeType && (
                          <span className="ml-2 text-muted">
                            ({DEGREE_TYPE_LABELS[mentor.degreeType] ?? mentor.degreeType})
                          </span>
                        )}
                      </p>
                      {mentor.specialization && (
                        <p className="text-sm text-secondary">
                          Major:{" "}
                          <span className="text-primary">{mentor.specialization}</span>
                        </p>
                      )}
                    </div>
                  )
                ) : activeCareerTab === "work" ? (
                  mentor.workExperience ? (
                    <div className="whitespace-pre-wrap text-sm text-secondary">
                      {mentor.workExperience}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">No work experience registered yet.</p>
                  )
                ) : (
                  <p className="text-sm text-muted">No certificates registered yet.</p>
                )}
              </div>
            </section>

            {/* My Specialties */}
            <section className="pb-8 border-b border-border last:border-b-0 last:pb-0">
              <h2 className="text-xl font-semibold text-primary">My Specialties</h2>
              <div className="mt-4 divide-y divide-border">
                {mentor.specialties.length === 0 ? (
                  <p className="text-sm text-muted">No specialties registered.</p>
                ) : (
                  mentor.specialties.map((item, index) => (
                    <div key={item} className="py-3">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between text-left font-semibold text-primary"
                        onClick={() =>
                          setOpenSpecialtyIndex((prev) => (prev === index ? null : index))
                        }
                      >
                        {item}
                        {/* Chevron icon: Rotates 180° when expanded */}
                        <ChevronDown
                          className={`w-5 h-5 text-muted transition-transform duration-200 ${
                            openSpecialtyIndex === index ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {openSpecialtyIndex === index && (
                        <p className="mt-2 text-sm text-secondary">
                          Contact me via message to discuss specific lesson content in this area.
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* ================= Right Column (Card) ================= */}
          <aside className="sticky top-6 h-fit">
            <div className="rounded-2xl border border-border bg-white shadow-md p-6 space-y-5">
              {/* 3 columns: Rating, Lessons, Price */}
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-primary">★{mentor.rating}</span>
                  </div>
                  <p className="text-xs text-muted">{mentor.reviewCount} reviews</p>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold text-primary">{mentor.lessons}</span>
                  <p className="text-xs text-muted">Lessons</p>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold text-primary">${mentor.price}</span>
                  <p className="text-xs text-muted">50-min lesson</p>
                </div>
              </div>

              {/* 3 buttons stacked vertically */}
              <button
                className="w-full bg-accent hover:bg-accent-hover focus:bg-accent-hover focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                onClick={onOpenBooking}
              >
                <Zap className="w-5 h-5" />
                Book Trial Lesson
              </button>

              <button
                className="w-full border border-border py-2.5 rounded-lg hover:bg-surface-hover transition"
                onClick={() => setIsMessageOpen(true)}
              >
                Send Message
              </button>

              <button className="w-full border border-border py-2.5 rounded-lg hover:bg-surface-hover transition">
                Save to Favorites
              </button>
            </div>
          </aside>
        </div>
      </div>

      {isMessageOpen && (
        <SendMessageModal
          mentorId={mentor.id}
          mentorName={mentor.name}
          isOpen={isMessageOpen}
          onClose={() => setIsMessageOpen(false)}
        />
      )}

      {isBookingOpen && <BookingModal mentor={mentor} isOpen onClose={onCloseBooking} />}
    </div>
  );
};
