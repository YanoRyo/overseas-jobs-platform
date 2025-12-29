"use client";
import { useState } from "react";
import BookingModal from "@/components/BookingModal";
import { MentorDetailModel } from "../types";

type Props = {
  mentor: MentorDetailModel;
  isBookingOpen: boolean;
  onOpenBooking: () => void;
  onCloseBooking: () => void;
};

export const MentorDetail = ({
  mentor,
  isBookingOpen,
  onOpenBooking,
  onCloseBooking,
}: Props) => {
  const [visibleCount, setVisibleCount] = useState(4);
  const showMore = () => {
    setVisibleCount(mentor.reviews.length);
  };
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    /* ① 画面全体の中央寄せ */
    <div className="flex justify-center px-6">
      <div className="flex gap-8 items-start">
        {/* ================= 左カラム ================= */}
        <div className="space-y-6">
          {/* プロフィールヘッダー */}
          <div className="flex items-start gap-6">
            {mentor.avatarUrl && (
              <img
                src={mentor.avatarUrl}
                alt={mentor.name}
                className="w-32 h-32 object-cover rounded-lg shadow-md"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {mentor.name}
                <span className="text-sm">{mentor.country}</span>
              </h1>
              <p className="text-gray-600 mt-2">{mentor.intro}</p>
              <p className="mt-2">
                <span className="font-semibold">教える科目:</span>{" "}
                {mentor.subjects.join(", ")}
              </p>
            </div>
          </div>

          {/* 自己紹介 */}
          <div>
            <h2 className="text-xl font-semibold">自己紹介</h2>
            <p className="mt-2 text-gray-700 whitespace-pre-wrap">
              {mentor.bio}
            </p>
          </div>

          {/* 言語 */}
          <div>
            <h2 className="text-xl font-semibold">話せる言語</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {mentor.spokenLanguages.map((lang, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full border text-sm bg-gray-50"
                >
                  {lang.name}{" "}
                  <span className="text-blue-600">{lang.level}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 生徒からの評価 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">生徒からの評価</h2>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl font-bold">⭐ {mentor.rating}</span>
              <span className="text-gray-600">
                {mentor.reviewCount}件の生徒レビューに基づく
              </span>
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mentor.reviews.slice(0, visibleCount).map((review) => (
                <li key={review.id} className="border rounded-lg p-4 shadow-sm">
                  <p className="font-medium">{review.author}</p>
                  <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                </li>
              ))}
            </ul>

            {visibleCount < mentor.reviews.length && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={showMore}
                  className="px-6 py-2 border rounded-lg bg-gray-50"
                >
                  すべての {mentor.reviews.length} レビューを表示
                </button>
              </div>
            )}
          </div>

          {/* 専門分野 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">私の専門分野</h2>
            <div className="divide-y">
              {mentor.specialties.map((item, index) => (
                <div key={index} className="py-3">
                  <button
                    className="flex justify-between w-full text-left font-medium"
                    onClick={() => toggleAccordion(index)}
                  >
                    {item}
                    <span>{openIndex === index ? "▲" : "▼"}</span>
                  </button>
                  {openIndex === index && (
                    <p className="mt-2 text-sm text-gray-600">
                      ここに {item} の詳細説明が入ります（仮）。
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= 右カラム（カード） ================= */}
        <div className="sticky top-6 h-fit">
          <div className="rounded-xl border bg-white shadow-md p-6 space-y-4">
            {/* 評価 */}
            <div>
              <p className="text-2xl font-bold">⭐ {mentor.rating}</p>
              <p className="text-sm text-gray-500">
                {mentor.lessons} 件の受講実績
              </p>
            </div>

            {/* 価格 */}
            <p className="text-lg font-semibold">
              ¥{mentor.price.toLocaleString()}{" "}
              <span className="text-sm font-normal text-gray-500">/ 25分</span>
            </p>

            {/* CTA */}
            <button
              className="mt-4 w-full bg-accent hover:bg-accent-hover focus:bg-accent-hover focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background text-white py-2 rounded-lg font-semibold transition-all duration-200"
              onClick={onOpenBooking}
            >
              体験レッスンを予約
            </button>

            <button className="w-full border py-2 rounded-lg hover:bg-gray-50 transition">
              マイリストに保存
            </button>
          </div>
        </div>
      </div>

      {isBookingOpen && (
        <BookingModal mentor={mentor} isOpen onClose={onCloseBooking} />
      )}
    </div>
  );
};
