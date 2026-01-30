"use client";

import { useMemo, useState } from "react";
import Flag from "react-world-flags";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
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
  native: "ネイティブ",
  c2: "C2",
  c1: "C1",
  b2: "中級 B2",
  b1: "中級 B1",
  a2: "初級 A2",
  a1: "初級 A1",
};

const DEGREE_TYPE_LABELS: Record<string, string> = {
  associate: "短期大学 / 準学士",
  bachelor: "学士",
  master: "修士",
  doctorate: "博士",
  diploma: "ディプロマ / 資格",
};

const pad2 = (value: number) => value.toString().padStart(2, "0");

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
      ? `${weekStartParts.year}年${weekStartParts.month}月${weekStartParts.day}日〜${rangeEndParts.month}月${rangeEndParts.day}日`
      : `${weekStartParts.year}年${weekStartParts.month}月${weekStartParts.day}日〜${rangeEndParts.year}年${rangeEndParts.month}月${rangeEndParts.day}日`;

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
  const weekdayFormatter = new Intl.DateTimeFormat("ja-JP", {
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

  const scanStartUtc = Date.UTC(scanStart.year, scanStart.month - 1, scanStart.day);
  const scanEndUtc = Date.UTC(scanEnd.year, scanEnd.month - 1, scanEnd.day);
  const totalScanDays = Math.round((scanEndUtc - scanStartUtc) / 86400000);

  for (let i = 0; i <= totalScanDays; i += 1) {
    const mentorDate = addDaysToDateParts(scanStart, i);
    const weekDay = new Date(Date.UTC(mentorDate.year, mentorDate.month - 1, mentorDate.day)).getUTCDay();

    availability
      .filter((slot) => slot.isEnabled && slot.dayOfWeek === weekDay)
      .forEach((slot) => {
        const startMinutes = parseTimeToMinutes(slot.startTime);
        const endMinutes = parseTimeToMinutes(slot.endTime);
        if (endMinutes <= startMinutes) return;

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
      });
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
  const [activeCareerTab, setActiveCareerTab] = useState<"education" | "work">(
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

  const baseDateParts = getZonedDateParts(new Date(), selectedTimezone);
  const weekStartParts = addDaysToDateParts(
    { year: baseDateParts.year, month: baseDateParts.month, day: baseDateParts.day },
    weekOffset * 7
  );

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
    mentor.spokenLanguages.length > 0 ? mentor.spokenLanguages : [{ name: "未登録", level: "" }];

  return (
    <div className="bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
          {/* ================= 左カラム ================= */}
          <div className="space-y-8">
            {/* プロフィール */}
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
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold text-primary">{mentor.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <span className="px-2 py-1 rounded-full border border-border bg-slate-50">
                        出身国
                      </span>
                      <span className="flex items-center gap-2">
                        <Flag code={mentor.country} className="w-6 h-4 rounded-sm" />
                        {countryName}
                      </span>
                    </div>
                  </div>
                  {mentor.intro && (
                    <div className="rounded-xl bg-slate-50 border border-border px-4 py-3 text-sm text-secondary">
                      {mentor.intro}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-primary">教える科目</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {mentor.subjects.length === 0 ? (
                        <span className="text-sm text-muted">未登録</span>
                      ) : (
                        mentor.subjects.map((subject) => (
                          <span
                            key={subject}
                            className="px-3 py-1 rounded-full border border-border bg-white text-sm text-primary"
                          >
                            {subject}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 自己紹介 */}
            <section className="pb-8 border-b border-border last:border-b-0 last:pb-0">
              <h2 className="text-xl font-semibold text-primary">自己紹介</h2>
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
                  {bioExpanded ? "閉じる" : "もっと見る"}
                </button>
              )}
            </section>

            {/* 話せる言語 */}
            <section className="pb-8 border-b border-border last:border-b-0 last:pb-0">
              <h2 className="text-xl font-semibold text-primary">話せる言語</h2>
              <div className="flex flex-wrap gap-2 mt-4">
                {languageList.map((lang, idx) => (
                  <span
                    key={`${lang.name}-${idx}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-slate-50 px-3 py-1 text-sm text-primary"
                  >
                    {lang.name}
                    {lang.level && (
                      <span className="text-accent font-semibold">
                        {LANGUAGE_LEVEL_LABELS[lang.level] ?? lang.level.toUpperCase()}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </section>

            {/* 生徒からの評価 */}
            <section className="pb-8 border-b border-border last:border-b-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-primary">生徒からの評価</h2>
                  <p className="text-sm text-muted mt-1">
                    {mentor.reviewCount}件のレビューに基づく
                  </p>
                </div>
                <div className="flex items-center gap-2 text-yellow-500">
                  <span className="text-3xl font-semibold">★</span>
                  <span className="text-3xl font-semibold text-primary">
                    {mentor.rating}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedReviews.length === 0 ? (
                  <p className="text-sm text-muted">レビューはまだありません。</p>
                ) : (
                  displayedReviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-xl border border-border bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-primary">{review.author}</p>
                        <div className="text-yellow-500 text-sm">
                          {"★".repeat(Math.round(review.rating))}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-secondary leading-relaxed">
                        {review.comment || "レビューが入力されていません。"}
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
                    {reviewExpanded ? "レビューを閉じる" : "全てのレビューを表示"}
                  </button>
                </div>
              )}
            </section>

            {/* スケジュール */}
            <section className="pb-8 border-b border-border last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-primary">スケジュール</h2>
                <button
                  type="button"
                  onClick={() => setScheduleOpen((prev) => !prev)}
                  className="text-sm text-accent hover:underline"
                >
                  {scheduleOpen ? "スケジュールを閉じる" : "全スケジュールを表示する"}
                </button>
              </div>

              {scheduleOpen && (
                <>
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      最初のレッスンの時間を選択してください。時間はあなたの時間帯で表示されています。
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
                        aria-label="前の週"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setWeekOffset((prev) => prev + 1)}
                        className="rounded-full border border-border p-2 text-muted hover:text-primary hover:border-border-hover transition"
                        aria-label="次の週"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium text-primary">
                        {weeklySchedule.rangeLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <label htmlFor="timezone" className="font-medium">
                        タイムゾーン
                      </label>
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
                            {option.label} ({option.offset})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <div className="min-w-[640px] grid grid-cols-7 gap-4">
                      {weeklySchedule.days.map((day) => (
                        <div key={day.key} className="space-y-3">
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
                      現在予約可能な日時はありません。
                    </p>
                  )}
                </>
              )}
            </section>

            {/* 経歴 */}
            <section className="pb-8 border-b border-border last:border-b-0 last:pb-0">
              <h2 className="text-xl font-semibold text-primary">経歴</h2>
              <div className="mt-4 flex gap-2 border-b border-border">
                {[
                  { id: "education", label: "学歴" },
                  { id: "work", label: "職務経歴" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCareerTab(tab.id as "education" | "work")}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
                      activeCareerTab === tab.id
                        ? "border-accent text-primary"
                        : "border-transparent text-muted hover:text-primary"
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
                      <p className="font-semibold text-primary">学位なし</p>
                      <p className="text-sm text-muted">学歴情報は登録されていません。</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-primary">
                        {mentor.university || "大学名未登録"}
                      </p>
                      <p className="text-sm text-secondary">
                        {mentor.degree || "学位未登録"}
                        {mentor.degreeType && (
                          <span className="ml-2 text-muted">
                            ({DEGREE_TYPE_LABELS[mentor.degreeType] ?? mentor.degreeType})
                          </span>
                        )}
                      </p>
                      {mentor.specialization && (
                        <p className="text-sm text-secondary">
                          専攻:{" "}
                          <span className="text-primary">{mentor.specialization}</span>
                        </p>
                      )}
                    </div>
                  )
                ) : mentor.workExperience ? (
                  <div className="whitespace-pre-wrap text-sm text-secondary">
                    {mentor.workExperience}
                  </div>
                ) : (
                  <p className="text-sm text-muted">職務経歴はまだ登録されていません。</p>
                )}
              </div>
            </section>

            {/* 専門分野 */}
            <section className="pb-8 border-b border-border last:border-b-0 last:pb-0">
              <h2 className="text-xl font-semibold text-primary">私の専門分野</h2>
              <div className="mt-4 divide-y divide-border">
                {mentor.specialties.length === 0 ? (
                  <p className="text-sm text-muted">専門分野は未登録です。</p>
                ) : (
                  mentor.specialties.map((item, index) => (
                    <div key={item} className="py-3">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between text-left text-sm font-semibold text-primary"
                        onClick={() =>
                          setOpenSpecialtyIndex((prev) => (prev === index ? null : index))
                        }
                      >
                        {item}
                        <span className="text-muted">
                          {openSpecialtyIndex === index ? "−" : "+"}
                        </span>
                      </button>
                      {openSpecialtyIndex === index && (
                        <p className="mt-2 text-sm text-secondary">
                          この分野のレッスンについて、具体的な内容はメッセージで相談できます。
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* ================= 右カラム（カード） ================= */}
          <aside className="sticky top-6 h-fit">
            <div className="rounded-2xl border border-border bg-white shadow-md p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-primary">
                    {mentor.reviewCount}
                  </p>
                  <p className="text-xs text-muted">レビュー数</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-primary">{mentor.lessons}</p>
                  <p className="text-xs text-muted">レッスン回数</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-slate-50 px-4 py-3">
                <p className="text-sm text-muted">レッスン料金</p>
                <p className="text-2xl font-semibold text-primary">
                  ${mentor.price.toLocaleString()}
                  <span className="text-sm font-normal text-muted"> / 25分</span>
                </p>
              </div>

              <button
                className="w-full bg-accent hover:bg-accent-hover focus:bg-accent-hover focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background text-white py-2.5 rounded-lg font-semibold transition-all duration-200"
                onClick={onOpenBooking}
              >
                体験レッスンを予約
              </button>

              <button
                className="w-full border border-border py-2.5 rounded-lg hover:bg-surface-hover transition"
                onClick={() => setIsMessageOpen(true)}
              >
                メッセージを送る
              </button>

              <button className="w-full border border-border py-2.5 rounded-lg hover:bg-surface-hover transition">
                マイリストに保存
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
