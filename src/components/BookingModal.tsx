"use client";
import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { X, Sunrise, Sun, Sunset, Moon } from "lucide-react";
import type { MentorDetailModel } from "@/features/mentors/types";
import { useRouter } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

type Props = {
  mentor: MentorDetailModel;
  onClose: () => void;
  isOpen: boolean;
};

export default function BookingModal({ isOpen, onClose, mentor }: Props) {
  const supabase = useSupabaseClient(); // ← ここでSupabaseクライアントを取得
  const user = useUser(); // ← 現在のログインユーザーを取得
  const [duration, setDuration] = useState(25);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const router = useRouter();

  // 続けるボタン押下時の処理
  const handleContinue = async () => {
    if (!selectedTime) {
      alert("時間を選択してください");
      return;
    }

    if (!user || !user.id) {
      alert("ログイン情報を取得できませんでした。再ログインしてください。");
      router.push("/auth/login?redirect=/checkout");
      return;
    }

    // ISO形式の time_slot を生成
    const [hours, minutes] = selectedTime.split(":");
    const reservationDate = new Date(selectedDate);
    reservationDate.setHours(Number(hours));
    reservationDate.setMinutes(Number(minutes));
    reservationDate.setSeconds(0);
    reservationDate.setMilliseconds(0);
    const startTime = reservationDate;
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      mentor_id: mentor.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: "pending",
    });

    if (error) {
      alert("予約に失敗しました。もう一度お試しください。");
      return;
    }

    const reservation = {
      mentorId: mentor.id,
      mentorName: mentor.name,
      mentorAvatarUrl: mentor.avatarUrl,
      mentorCountry: mentor.country,
      duration,
      date: selectedDate.toISOString(),
      time: selectedTime,
    };
    localStorage.setItem("pendingReservation", JSON.stringify(reservation));

    router.push("/checkout");
  };

  // 時間帯定義
  const TIME_PERIODS = [
    { name: "朝", icon: Sunrise, start: "06:00", end: "12:00" },
    { name: "昼", icon: Sun, start: "12:00", end: "17:00" },
    { name: "夕方", icon: Sunset, start: "17:00", end: "21:00" },
    { name: "夜", icon: Moon, start: "21:00", end: "24:00" },
  ] as const;

  // 日付変更時の処理（選択済み時間が無効ならリセット）
  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    if (selectedTime) {
      const newDayOfWeek = newDate.getDay();
      const enabledSlots = mentor.availability.filter(
        (slot) => slot.dayOfWeek === newDayOfWeek && slot.isEnabled
      );
      const availableTimes: string[] = [];
      for (const slot of enabledSlots) {
        const startMinutes =
          parseInt(slot.startTime.split(":")[0]) * 60 +
          parseInt(slot.startTime.split(":")[1]);
        const endMinutes =
          parseInt(slot.endTime.split(":")[0]) * 60 +
          parseInt(slot.endTime.split(":")[1]);
        for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
          const hour = Math.floor(minutes / 60);
          const minute = minutes % 60;
          availableTimes.push(
            `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
          );
        }
      }
      if (!availableTimes.includes(selectedTime)) {
        setSelectedTime(null);
      }
    }
  };

  // 時間文字列を分に変換
  const parseTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // 指定した日付の曜日に対して、メンターの availability から予約可能な時間スロットを取得
  const getAvailableSlotsForDate = (date: Date): string[] => {
    const dayOfWeek = date.getDay();

    const enabledSlots = mentor.availability.filter(
      (slot) => slot.dayOfWeek === dayOfWeek && slot.isEnabled
    );

    if (enabledSlots.length === 0) return [];

    const times: string[] = [];
    for (const slot of enabledSlots) {
      const startMinutes = parseTimeToMinutes(slot.startTime);
      const endMinutes = parseTimeToMinutes(slot.endTime);

      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        times.push(
          `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        );
      }
    }

    return [...new Set(times)].sort();
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
    const offsetMinutes = -new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? "+" : "-";
    return `GMT ${sign}${hours}:${minutes.toString().padStart(2, "0")}`;
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
              <img
                src={mentor.avatarUrl}
                alt={mentor.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold">
                体験レッスンを予約する
              </h2>
              <p className="text-sm text-secondary mt-1">
                あなたのレベルと学習プランについて講師と話し合います
              </p>
            </div>
          </div>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-muted hover:text-primary transition-colors" />
          </button>
        </div>

        {/* ② 時間選択（セグメントコントロール） */}
        <div className="flex border border-gray-300 rounded-lg">
          <button
            onClick={() => setDuration(25)}
            className={`flex-1 py-2 text-sm text-center transition-colors rounded-l-lg ${
              duration === 25
                ? "bg-gray-100 font-semibold text-primary"
                : "bg-white text-primary hover:bg-gray-50"
            }`}
          >
            25分
          </button>
          <div className="w-px bg-gray-300" />
          <button
            onClick={() => setDuration(50)}
            className={`flex-1 py-2 text-sm text-center transition-colors rounded-r-lg ${
              duration === 50
                ? "bg-gray-100 font-semibold text-primary"
                : "bg-white text-primary hover:bg-gray-50"
            }`}
          >
            50分
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
                thisWeekStart.setDate(today.getDate() - today.getDay());

                const selectedWeekStart = new Date(selectedDate);
                selectedWeekStart.setDate(
                  selectedDate.getDate() - selectedDate.getDay()
                );

                return selectedWeekStart <= thisWeekStart ? true : false;
              })()}
              className="p-2 rounded-lg border border-border text-secondary hover:bg-surface-hover disabled:text-muted disabled:cursor-not-allowed transition-colors"
              aria-label="先週へ"
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

            <p className="text-base font-semibold">
              {(() => {
                const startOfWeek = new Date(selectedDate);
                startOfWeek.setDate(
                  selectedDate.getDate() - selectedDate.getDay()
                );
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                const startMonth = startOfWeek.getMonth() + 1;
                const startDate = startOfWeek.getDate();
                const endDate = endOfWeek.getDate();
                const year = startOfWeek.getFullYear();

                if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
                  return `${year}年${startMonth}月${startDate}日〜${endDate}日`;
                } else {
                  const endMonth = endOfWeek.getMonth() + 1;
                  return `${year}年${startMonth}月${startDate}日〜${endMonth}月${endDate}日`;
                }
              })()}
            </p>

            {/* 来週ボタン（右矢印） */}
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 7);
                handleDateChange(newDate);
              }}
              className="p-2 rounded-lg border border-border text-secondary hover:bg-surface-hover transition-colors"
              aria-label="来週へ"
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
                selectedDate.getDate() - selectedDate.getDay()
              );

              const day = new Date(startOfWeek);
              day.setDate(startOfWeek.getDate() + i);

              const weekday = day.toLocaleDateString("ja-JP", {
                weekday: "short",
              });
              const dateNum = day.getDate();

              const isSelected =
                selectedDate.toDateString() === day.toDateString();

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
          あなたのタイムゾーン、
          {Intl.DateTimeFormat().resolvedOptions().timeZone} ({getGmtOffset()})
        </p>

        {/* ④ 時間帯ごとのスロット */}
        <div className="space-y-4 flex-1 overflow-y-auto">
          {(() => {
            const availableSlots = getAvailableSlotsForDate(selectedDate);

            if (availableSlots.length === 0) {
              return (
                <p className="text-secondary text-sm text-center py-4">
                  この日は予約可能な時間がありません
                </p>
              );
            }

            return TIME_PERIODS.map(({ name, icon: Icon, start, end }) => {
              const slots = getTimeSlotsForPeriod(start, end, availableSlots);
              if (slots.length === 0) return null;

              return (
                <div key={name}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-muted" />
                    <p className="font-semibold">{name}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 rounded-lg border text-sm text-center ${
                          selectedTime === time
                            ? "bg-accent text-white border-accent"
                            : "border-border text-primary hover:bg-surface-hover"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>

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
          続ける
        </button>
      </Dialog.Panel>
    </Dialog>
  );
}
