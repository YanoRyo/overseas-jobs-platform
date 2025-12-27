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
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 左カラム */}
      <div className="md:col-span-2 space-y-6">
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
              {mentor.name} <span className="text-sm">{mentor.country}</span>
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
          <p className="mt-2 text-gray-700 whitespace-pre-wrap">{mentor.bio}</p>
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
                {lang.name} <span className="text-blue-600">{lang.level}</span>
              </span>
            ))}
          </div>
        </div>

        {/* レッスン評価 */}
        <div>
          <h2 className="text-xl font-semibold">レッスン評価</h2>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {Object.entries(mentor.ratingsDetail).map(([key, value]) => (
              <div
                key={key}
                className="border rounded-lg p-3 flex flex-col items-center shadow-sm"
              >
                <p className="text-lg font-bold">{value.toFixed(1)}</p>
                <p className="text-sm text-gray-600">
                  {
                    {
                      accuracy: "確実さ",
                      clarity: "明瞭さ",
                      progress: "進歩",
                      preparedness: "準備度",
                    }[key]
                  }
                </p>
              </div>
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
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {review.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{review.author}</p>
                  </div>
                </div>

                <div className="flex gap-1 mb-2">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>

                <p className="text-gray-700 text-sm">{review.comment}</p>
              </li>
            ))}
          </ul>

          {visibleCount < mentor.reviews.length && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={showMore}
                className="px-6 py-2 border rounded-lg bg-gray-50 hover:bg-gray-100"
              >
                すべての {mentor.reviews.length} レビューを表示
              </button>
            </div>
          )}
        </div>

        {/* 私の専門分野 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">私の専門分野</h2>
          <div className="divide-y">
            {mentor.specialties.map((item, index) => (
              <div key={index} className="py-3">
                <button
                  className="flex justify-between w-full text-left text-gray-800 font-medium"
                  onClick={() => toggleAccordion(index)}
                >
                  {item}
                  <span>{openIndex === index ? "▲" : "▼"}</span>
                </button>
                {openIndex === index && (
                  <p className="mt-2 text-sm text-gray-600">
                    ここに {item} の詳細説明が入ります（仮データ）。
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右カラム */}
      <div className="sticky top-6 h-fit border rounded-lg shadow p-4">
        <div className="relative">
          {mentor.avatarUrl && (
            <img
              src={mentor.introVideoUrl}
              alt="Intro Video"
              className="rounded-lg w-full object-cover"
            />
          )}
          <button className="absolute inset-0 flex items-center justify-center text-white text-3xl">
            ▶
          </button>
        </div>

        <div className="mt-4">
          <p className="font-bold text-lg">⭐ {mentor.rating}</p>
          <p className="text-sm text-gray-500">{mentor.lessons} 件の受講実績</p>
          <p className="font-semibold mt-2">
            ¥{mentor.price.toLocaleString()} / 25分
          </p>

          {/* モーダルを開くボタン */}
          <button
            className="mt-4 w-full bg-pink-500 text-white py-2 rounded-lg font-semibold"
            onClick={onOpenBooking}
          >
            体験レッスンを予約
          </button>
          {/* <button className="mt-2 w-full border py-2 rounded-lg">
            メッセージを送る
          </button> */}
          <button className="mt-2 w-full border py-2 rounded-lg">
            マイリストに保存
          </button>
          {/* <button className="mt-2 w-full border py-2 rounded-lg">
            講師をシェア
          </button> */}

          {/* <div className="mt-4 text-sm text-gray-600">
            <p>📌 注目の講師: {mentor.recentBookingInfo}</p>
            <p className="mt-1">⏱ {mentor.replyTime}</p>
          </div> */}
        </div>
      </div>
      {/* BookingModal */}
      {isBookingOpen && (
        <BookingModal mentor={mentor} isOpen onClose={onCloseBooking} />
      )}
    </div>
  );
};
