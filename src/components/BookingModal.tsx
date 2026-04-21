"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Dialog } from "@headlessui/react";
import { X, Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import type { MentorDetailModel } from "@/features/mentors/types";
import { Link } from "@/i18n/navigation";
import { useUser } from "@supabase/auth-helpers-react";
import { useAuthModal } from "@/features/auth/context/AuthModalProvider";
import { useBookedSlots } from "@/features/checkout/hooks/useBookedSlots";
import { useCreateBooking } from "@/features/checkout/hooks/useCreateBooking";
import {
  buildAvailableSlotsForViewerDate,
  formatGmtOffset,
  getZonedDateParts,
} from "@/features/mentors/utils/scheduleTimezone";

type Props = {
  mentor: MentorDetailModel;
  onClose: () => void;
  isOpen: boolean;
};

export default function BookingModal({ isOpen, onClose, mentor }: Props) {
  const t = useTranslations("booking");
  const tc = useTranslations("common");
  const locale = useLocale();
  const user = useUser();
  const { openAuthModal } = useAuthModal();
  const { createBookingAndCheckout } = useCreateBooking();
  const viewerTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );
  const [duration, setDuration] = useState(25);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const { isSlotBooked, loading: bookingsLoading } = useBookedSlots(
    mentor.id,
    selectedDate,
    isOpen,
    user?.id
  );

  // 続けるボタン押下時の処理
  const handleContinue = async () => {
    if (!selectedTime) {
      alert(t("selectTime"));
      return;
    }

    if (!user || !user.id) {
      openAuthModal({
        defaultMode: "login",
        initialRole: "student",
        variant: "booking",
      });
      return;
    }

    const [hours, minutes] = selectedTime.split(":");
    const startTime = new Date(selectedDate);
    startTime.setHours(Number(hours));
    startTime.setMinutes(Number(minutes));
    startTime.setSeconds(0);
    startTime.setMilliseconds(0);

    await createBookingAndCheckout({
      userId: user.id,
      mentorId: mentor.id,
      mentorName: mentor.name,
      mentorAvatarUrl: mentor.avatarUrl,
      mentorCountry: mentor.country,
      hourlyRate: mentor.price,
      duration,
      startTime,
      time: selectedTime,
    });
  };

  // 時間帯定義
  const TIME_PERIODS = [
    { nameKey: "morning" as const, icon: Sunrise, start: "06:00", end: "12:00" },
    { nameKey: "afternoon" as const, icon: Sun, start: "12:00", end: "17:00" },
    { nameKey: "evening" as const, icon: Sunset, start: "17:00", end: "21:00" },
    { nameKey: "night" as const, icon: Moon, start: "21:00", end: "24:00" },
  ] as const;

  // duration変更時の処理（選択済み時間が無効or予約済みならリセット）
  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    if (selectedTime) {
      const availableTimes = getAvailableSlotsForDate(selectedDate, newDuration);
      if (
        !availableTimes.includes(selectedTime) ||
        isSlotBooked(selectedDate, selectedTime, newDuration)
      ) {
        setSelectedTime(null);
      }
    }
  };

  // 日付変更時の処理（選択済み時間が無効or予約済みならリセット）
  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    if (selectedTime) {
      const availableTimes = getAvailableSlotsForDate(newDate, duration);
      if (
        !availableTimes.includes(selectedTime) ||
        isSlotBooked(newDate, selectedTime, duration)
      ) {
        setSelectedTime(null);
      }
    }
  };

  const getViewerDateParts = (date: Date) => {
    const parts = getZonedDateParts(date, viewerTimeZone);
    return {
      year: parts.year,
      month: parts.month,
      day: parts.day,
    };
  };

  const getViewerDateKey = (date: Date) => {
    const parts = getViewerDateParts(date);
    return `${parts.year}-${parts.month}-${parts.day}`;
  };

  const getViewerDayOfWeek = (date: Date) => {
    const parts = getViewerDateParts(date);
    return new Date(
      Date.UTC(parts.year, parts.month - 1, parts.day)
    ).getUTCDay();
  };

  // メンターのtimezoneで登録されたavailabilityを、閲覧者のtimezoneの日付・時刻に変換して取得
  const getAvailableSlotsForDate = (date: Date, lessonDuration: number): string[] => {
    return buildAvailableSlotsForViewerDate({
      availability: mentor.availability,
      mentorTimeZone: mentor.timezone || "UTC",
      viewerTimeZone,
      viewerDateParts: getViewerDateParts(date),
      lessonDuration,
    });
  };

  // 時間帯ごとにスロットをフィルタリング
  const getTimeSlotsForPeriod = (
    start: string,
    end: string,
    availableSlots: string[]
  ) => {
    return availableSlots.filter((time) => time >= start && time < end);
  };

  // タイムゾーンのGMTオフセットを取得
  const getGmtOffset = (): string => {
    return formatGmtOffset(new Date(), viewerTimeZone);
  };

  const formatWeekRange = (date: Date): string => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - getViewerDayOfWeek(date));

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startLabel = new Intl.DateTimeFormat(locale, {
      timeZone: viewerTimeZone,
      month: "short",
      day: "numeric",
    }).format(startOfWeek);
    const endLabel = new Intl.DateTimeFormat(locale, {
      timeZone: viewerTimeZone,
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(endOfWeek);

    return `${startLabel} - ${endLabel}`;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <Dialog.Panel className="bg-surface rounded-2xl p-6 w-full max-w-md space-y-4 h-[700px] flex flex-col">
        {/* ① ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {mentor.avatarUrl && (
              <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                <Image
                  src={mentor.avatarUrl}
                  alt={mentor.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">
                {t("title")}
              </h2>
              <p className="text-sm text-secondary mt-1">
                {t("subtitle")}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={tc("close")}>
            <X className="w-6 h-6 text-muted hover:text-primary transition-colors" />
          </button>
        </div>

        {/* ② 時間選択（セグメントコントロール） */}
        <div className="flex border border-gray-300 rounded-lg">
          <button
            onClick={() => handleDurationChange(25)}
            className={`flex-1 py-2 text-sm text-center transition-colors rounded-l-lg ${
              duration === 25
                ? "bg-gray-100 font-semibold text-primary"
                : "bg-white text-primary hover:bg-gray-50"
            }`}
          >
            {t("min25")}
          </button>
          <div className="w-px bg-gray-300" />
          <button
            onClick={() => handleDurationChange(50)}
            className={`flex-1 py-2 text-sm text-center transition-colors rounded-r-lg ${
              duration === 50
                ? "bg-gray-100 font-semibold text-primary"
                : "bg-white text-primary hover:bg-gray-50"
            }`}
          >
            {t("min50")}
          </button>
        </div>

        {/* ③ カレンダー */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            {/* 先週ボタン（左矢印） */}
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 7);
                handleDateChange(newDate);
              }}
              disabled={(() => {
                const today = new Date();
                const thisWeekStart = new Date(today);
                thisWeekStart.setDate(today.getDate() - getViewerDayOfWeek(today));

                const selectedWeekStart = new Date(selectedDate);
                selectedWeekStart.setDate(
                  selectedDate.getDate() - getViewerDayOfWeek(selectedDate)
                );

                return selectedWeekStart <= thisWeekStart ? true : false;
              })()}
              className="p-2 rounded-lg border border-border text-secondary hover:bg-surface-hover disabled:text-muted disabled:cursor-not-allowed transition-colors"
              aria-label={t("previousWeek")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <p className="text-base font-semibold">{formatWeekRange(selectedDate)}</p>

            {/* 来週ボタン（右矢印） */}
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 7);
                handleDateChange(newDate);
              }}
              className="p-2 rounded-lg border border-border text-secondary hover:bg-surface-hover transition-colors"
              aria-label={t("nextWeek")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div className="flex justify-around">
            {Array.from({ length: 7 }).map((_, i) => {
              const startOfWeek = new Date(selectedDate);
              startOfWeek.setDate(
                selectedDate.getDate() - getViewerDayOfWeek(selectedDate)
              );

              const day = new Date(startOfWeek);
              day.setDate(startOfWeek.getDate() + i);

              const weekday = day.toLocaleDateString(locale, {
                timeZone: viewerTimeZone,
                weekday: "short",
              });
              const dateNum = getViewerDateParts(day).day;

              const isSelected =
                getViewerDateKey(selectedDate) === getViewerDateKey(day);

              return (
                <button
                  key={i}
                  onClick={() => handleDateChange(day)}
                  className="flex flex-col items-center gap-1 p-1 cursor-pointer"
                >
                  <span
                    className={`text-sm ${
                      isSelected ? "text-blue-500 font-medium" : "text-secondary"
                    }`}
                  >
                    {weekday}
                  </span>
                  <span
                    className={`w-9 h-9 flex items-center justify-center text-base rounded-lg ${
                      isSelected
                        ? "bg-blue-100 text-blue-600 font-semibold border border-blue-300"
                        : "text-primary hover:bg-surface-hover"
                    }`}
                  >
                    {dateNum}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* タイムゾーン表示 */}
        <p className="text-sm text-secondary">
          {t("yourTimezone", {
            timezone: viewerTimeZone,
            offset: getGmtOffset(),
          })}
        </p>

        {/* ④ 時間帯ごとのスロット */}
        <div className={`space-y-4 flex-1 overflow-y-auto ${bookingsLoading ? "opacity-50 pointer-events-none" : ""}`}>
          {(() => {
            const availableSlots = getAvailableSlotsForDate(selectedDate, duration);

            if (availableSlots.length === 0) {
              return (
                <p className="text-secondary text-sm text-center py-4">
                  {t("noAvailableTimes")}
                </p>
              );
            }

            return TIME_PERIODS.map(({ nameKey, icon: Icon, start, end }) => {
              const slots = getTimeSlotsForPeriod(start, end, availableSlots);
              if (slots.length === 0) return null;

              return (
                <div key={nameKey}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-muted" />
                    <p className="font-semibold">{t(nameKey)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((time) => {
                      const booked = isSlotBooked(selectedDate, time, duration);
                      return (
                        <button
                          key={time}
                          onClick={() => !booked && setSelectedTime(time)}
                          disabled={booked}
                          className={`py-2 rounded-lg border text-sm text-center ${
                            booked
                              ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
                              : selectedTime === time
                                ? "bg-accent text-white border-accent"
                                : "border-border text-primary hover:bg-surface-hover"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        <p className="rounded-lg border border-border bg-[#fafafb] px-3 py-2 text-xs leading-5 text-secondary">
          <Link
            href="/cancellation-policy"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            {t("cancellationNotice")}
          </Link>
        </p>

        {/* ⑤ 続けるボタン */}
        <button
          onClick={handleContinue}
          disabled={!selectedTime}
          className={`w-full py-3 rounded-lg font-semibold transition-colors mt-auto shrink-0 ${
            selectedTime
              ? "bg-accent text-white hover:bg-accent-hover"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {t("continue")}
        </button>
      </Dialog.Panel>
    </Dialog>
  );
}
