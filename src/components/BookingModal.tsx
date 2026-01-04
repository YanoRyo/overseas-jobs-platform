"use client";
import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import type { MentorListItem } from "@/features/mentors/types";
import { useRouter } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

type Props = {
  mentor: MentorListItem;
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

  const timeSlots = {
    朝: ["7:00", "8:00", "9:00"],
    昼: ["12:00", "13:00", "14:00"],
    夕方: ["16:00", "17:00", "18:00"],
    夜: ["19:00", "20:00", "21:00"],
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <Dialog.Panel className="bg-surface rounded-2xl p-6 w-full max-w-xl space-y-6">
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
            <h2 className="text-xl font-semibold">
              {mentor.name}さんを予約する
            </h2>
          </div>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-muted hover:text-primary transition-colors" />
          </button>
        </div>

        {/* ② 時間選択 */}
        <div className="flex gap-4">
          {[25, 50].map((min) => (
            <button
              key={min}
              onClick={() => setDuration(min)}
              className={`flex-1 px-4 py-2 rounded-lg border text-center font-medium ${
                duration === min
                  ? "bg-accent text-white"
                  : "border-border text-primary"
              }`}
            >
              {min}分
            </button>
          ))}
        </div>

        {/* ③ カレンダー */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            {/* 先週ボタン（左矢印） */}
            <button
              onClick={() =>
                setSelectedDate(
                  new Date(selectedDate.setDate(selectedDate.getDate() - 7))
                )
              }
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
              className="text-accent font-medium p-2 rounded-full hover:bg-surface-hover disabled:text-muted disabled:cursor-not-allowed transition-colors"
              aria-label="先週へ"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-8 h-8"
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
              onClick={() =>
                setSelectedDate(
                  new Date(selectedDate.setDate(selectedDate.getDate() + 7))
                )
              }
              className="text-accent font-medium p-2 rounded-full hover:bg-surface-hover transition-colors"
              aria-label="来週へ"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-8 h-8"
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

          <div className="flex justify-between">
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
                  onClick={() => setSelectedDate(day)}
                  className={`flex flex-col items-center p-2 w-10 h-14 rounded-lg cursor-pointer
            ${
              isSelected
                ? "bg-accent text-white font-semibold"
                : "bg-transparent text-primary hover:bg-surface-hover"
            }
          `}
                >
                  <span className="text-sm">{weekday}</span>
                  <span className="text-lg">{dateNum}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ④ 時間帯ごとのスロット */}
        <div className="space-y-4">
          {Object.entries(timeSlots).map(([period, slots]) => (
            <div key={period}>
              <p className="font-semibold mb-2">{period}</p>
              <div className="flex flex-wrap gap-2">
                {slots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`px-3 py-2 rounded-lg border text-sm ${
                      selectedTime === time
                        ? "bg-accent text-white"
                        : "border-border text-primary"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ⑤ 続けるボタン＋注意書き */}
        <div className="space-y-2">
          <button
            onClick={handleContinue}
            className="relative w-full bg-accent text-white py-4 rounded-lg font-semibold hover:bg-accent-hover transition-colors"
          >
            続ける
            <span className="absolute left-1/2 bottom-0 translate-x-[-50%] text-xs text-white opacity-70">
              予約にはログインが必要です
            </span>
          </button>

          <p className="text-sm text-center text-primary">
            まだアカウントがありませんか？{" "}
            <span className="inline-flex gap-1">
              <button
                onClick={() => router.push("/auth/login?redirect=checkout")}
                className="text-accent underline hover:text-accent-hover font-semibold transition-colors"
              >
                ログイン
              </button>
              または
              <button
                onClick={() => router.push("/auth/signup?redirect=checkout")}
                className="text-accent underline hover:text-accent-hover font-semibold transition-colors"
              >
                新規登録
              </button>
            </span>
          </p>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
