"use client";

import { use, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import BookingModal from "@/components/BookingModal";

export default function MentorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 仮レビューリスト
  const reviewList = [
    {
      id: 1,
      name: "KUNITOMO",
      date: "2025年9月9日",
      rating: 5,
      text: "自分に過信せずに復習を怠らない事",
    },
    {
      id: 2,
      name: "Nagisa",
      date: "2025年9月4日",
      rating: 4,
      text: "自分で考える力がつくように根気よく指導してくださいました。",
    },
    {
      id: 3,
      name: "Julian",
      date: "2025年8月26日",
      rating: 5,
      text: "素晴らしい先生です！",
    },
    {
      id: 4,
      name: "Hiroki",
      date: "2025年7月29日",
      rating: 5,
      text: "先生のレッスンは私にとても合っています。これからのレッスンを楽しみにしています！",
    },
    {
      id: 5,
      name: "Ena",
      date: "2025年7月27日",
      rating: 5,
      text: "自分のニーズに沿って、分かりやすく、優しく教えてくださいます。",
    },
    {
      id: 6,
      name: "仁恵",
      date: "2025年7月7日",
      rating: 5,
      text: "プロフィール通りの方で、子供のレッスンも楽しく進めてくれます！",
    },
  ];

  const [visibleCount, setVisibleCount] = useState(4);
  const showMore = () => setVisibleCount(reviewList.length);

  // 仮: 専門分野
  const specialties = [
    "英会話",
    "ビジネス英語",
    "初級者向け英語",
    "子ども向け英会話",
    "英語の宿題のお手伝い",
    "留学準備",
    "中級英語",
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // 予約モーダルの状態管理
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // DBからデータ取得
  useEffect(() => {
    const fetchMentor = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("mentors")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching mentor:", error.message);
      } else {
        setMentor(data);
      }
      setLoading(false);
    };

    fetchMentor();
  }, [id]);

  if (loading) return <div className="p-6">読み込み中...</div>;
  if (!mentor)
    return <div className="p-6">メンターが見つかりませんでした。</div>;

  // 表示用データ（仮データ込み）
  // const displayMentor = {
  //   id: mentor.id,
  //   name: mentor.name,
  //   country: mentor.country,
  //   location: mentor.location,
  //   languages: mentor.languages,
  //   job: mentor.job,
  //   reviews: mentor.reviews,
  //   createdAt: mentor.created_at,
  //   bio: mentor.bio,
  //   avatarUrl: mentor.avatar_url,
  //   price:
  //     typeof mentor.price === "string"
  //       ? Number(mentor.price.replace(/[^0-9]/g, "")) || 2000
  //       : mentor.price,
  //   rating: mentor.rating,
  //   lessons: mentor.reviews,
  //   intro: "様々な科目に経験を持つ講師、4年の経験があります。",
  //   subjects: ["英語レッスン"],
  //   spokenLanguages: [
  //     { name: "タミル語", level: "ネイティブ" },
  //     { name: "英語", level: "ネイティブ" },
  //     { name: "オランダ語", level: "上級 C2" },
  //     { name: "フランス語", level: "中級 A2" },
  //   ],
  //   ratingsDetail: {
  //     accuracy: 4.3,
  //     clarity: 4.5,
  //     progress: 4.7,
  //     preparedness: 4.5,
  //   },
  //   introVideoUrl: "https://placehold.co/400x250?text=Intro+Video",
  //   recentBookingInfo: "過去48時間で3人が予約しました",
  //   replyTime: "通常3時間以内に返信があります",
  // };
  const displayMentor = mentor && {
    id: mentor.id,
    name: mentor.name,
    country: mentor.country_code, // DBカラム名に合わせる
    location: mentor.location,
    languages: mentor.languages || "英語, 日本語", // mentor_languagesテーブルから取得可能
    job: mentor.job_title, // DBのjob_titleを使う
    reviews: mentor.review_count,
    createdAt: mentor.created_at,
    bio: mentor.bio,
    avatarUrl: mentor.avatar_url,
    price: Number(mentor.hourly_rate), // hourly_rateをpriceに変換
    rating: Number(mentor.rating_avg),
    intro: "様々な科目に経験を持つ講師、4年の経験があります。",
    subjects: ["英語レッスン"],
    spokenLanguages: [
      { name: "タミル語", level: "ネイティブ" },
      { name: "英語", level: "ネイティブ" },
      { name: "オランダ語", level: "上級 C2" },
      { name: "フランス語", level: "中級 A2" },
    ],
    ratingsDetail: {
      accuracy: 4.3,
      clarity: 4.5,
      progress: 4.7,
      preparedness: 4.5,
    },
    introVideoUrl: "https://placehold.co/400x250?text=Intro+Video",
    recentBookingInfo: "過去48時間で3人が予約しました",
    replyTime: "通常3時間以内に返信があります",
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 左カラム */}
      <div className="md:col-span-2 space-y-6">
        {/* プロフィールヘッダー */}
        <div className="flex items-start gap-6">
          <img
            src={displayMentor.avatarUrl}
            alt={displayMentor.name}
            className="w-32 h-32 object-cover rounded-lg shadow-md"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {displayMentor.name}{" "}
              <span className="text-sm">{displayMentor.country}</span>
            </h1>
            <p className="text-gray-600 mt-2">{displayMentor.intro}</p>
            <p className="mt-2">
              <span className="font-semibold">教える科目:</span>{" "}
              {displayMentor.subjects.join(", ")}
            </p>
          </div>
        </div>

        {/* 自己紹介 */}
        <div>
          <h2 className="text-xl font-semibold">自己紹介</h2>
          <p className="mt-2 text-gray-700 whitespace-pre-wrap">
            {displayMentor.bio}
          </p>
        </div>

        {/* 言語 */}
        <div>
          <h2 className="text-xl font-semibold">話せる言語</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {displayMentor.spokenLanguages.map((lang, idx) => (
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
            {Object.entries(displayMentor.ratingsDetail).map(([key, value]) => (
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
            <span className="text-3xl font-bold">
              ⭐ {displayMentor.rating}
            </span>
            <span className="text-gray-600">
              {reviewList.length}件の生徒レビューに基づく
            </span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviewList.slice(0, visibleCount).map((review) => (
              <li key={review.id} className="border rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{review.name}</p>
                    <p className="text-xs text-gray-500">{review.date}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm">{review.text}</p>
              </li>
            ))}
          </ul>
          {visibleCount < reviewList.length && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={showMore}
                className="px-6 py-2 border rounded-lg bg-gray-50 hover:bg-gray-100"
              >
                すべての {reviewList.length} レビューを表示
              </button>
            </div>
          )}
        </div>

        {/* 私の専門分野 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">私の専門分野</h2>
          <div className="divide-y">
            {specialties.map((item, index) => (
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
          <img
            src={displayMentor.introVideoUrl}
            alt="Intro Video"
            className="rounded-lg w-full object-cover"
          />
          <button className="absolute inset-0 flex items-center justify-center text-white text-3xl">
            ▶
          </button>
        </div>

        <div className="mt-4">
          <p className="font-bold text-lg">⭐ {displayMentor.rating}</p>
          <p className="text-sm text-gray-500">
            {displayMentor.lessons} 件の受講実績
          </p>
          <p className="font-semibold mt-2">
            ¥{displayMentor.price.toLocaleString()} / 25分
          </p>

          {/* モーダルを開くボタン */}
          <button
            className="mt-4 w-full bg-pink-500 text-white py-2 rounded-lg font-semibold"
            onClick={() => setIsBookingOpen(true)}
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
            <p>📌 注目の講師: {displayMentor.recentBookingInfo}</p>
            <p className="mt-1">⏱ {displayMentor.replyTime}</p>
          </div> */}
        </div>
      </div>
      {/* BookingModal */}
      {isBookingOpen && (
        <BookingModal
          mentor={displayMentor}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      )}
    </div>
  );
}
