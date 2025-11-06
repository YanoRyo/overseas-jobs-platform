"use client";
import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ダミーデータ
const reviews = [
  {
    name: "田中 花子",
    avatarUrl: "https://i.pravatar.cc/100?img=1",
    content: "とても丁寧で、初めてでも話しやすかったです。",
  },
  {
    name: "山本 太郎",
    avatarUrl: "https://i.pravatar.cc/100?img=2",
    content: "面接練習が本当に役立ちました。またお願いしたいです！",
  },
  {
    name: "佐藤 美咲",
    avatarUrl: "https://i.pravatar.cc/100?img=3",
    content: "海外就職のアドバイスが的確でした。",
  },
];

export default function ReviewCarousel() {
  const [current, setCurrent] = useState(0);

  const prevReview = () => {
    setCurrent((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const nextReview = () => {
    setCurrent((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  const review = reviews[current];

  return (
    <div className="space-y-3">
      {/* 上部：レビュー件数と切り替えボタン */}
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-primary">
          {reviews.length}件のレビュー
        </span>
        <div className="flex gap-2">
          <button
            onClick={prevReview}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-surface-hover transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextReview}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-surface-hover transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 下部：レビュー表示カード */}
      <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Image
            src={review.avatarUrl}
            alt={review.name}
            width={32}
            height={32}
            className="rounded-md object-cover"
          />
          <span className="font-medium text-primary">{review.name}</span>
        </div>
        <p className="text-sm text-secondary">{review.content}</p>
      </div>
    </div>
  );
}
