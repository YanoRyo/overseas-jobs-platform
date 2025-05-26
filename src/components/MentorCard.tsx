import { useState } from "react";
import Flag from "react-world-flags";
import Image from "next/image";
import Link from "next/link";

const countryCodeMap: Record<string, string> = {
  Japan: "jp",
  "South Korea": "kr",
  USA: "us",
  Taiwan: "tw",
  Mexico: "mx",
};

type Mentor = {
  id: number;
  name: string;
  avatarUrl: string;
  location: string;
  languages: string;
  job: string;
  bio: string;
  rating: number;
  reviews: number;
  price: string;
  country: string;
};
type MentorCardProps = {
  mentor: Mentor;
  onBook: () => void;
};
export default function MentorCard({ mentor, onBook }: MentorCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex flex-col md:flex-row border rounded-xl shadow p-8 gap-8 items-stretch min-h-[220px]">
      {/* ① アバター */}
      <div className="relative w-32 h-32 flex-shrink-0">
        <Image
          src={mentor.avatarUrl}
          alt={mentor.name}
          fill
          className="object-cover rounded-lg"
        />
      </div>

      {/* ② テキスト情報 */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            {/* <Link href={`/detail`}  */}
            <div className="hover:underline text-blue-600">{mentor.name}</div>

            {/* </Link> */}
            {/* 国旗アイコン（枠線付き） */}
            <div className="border border-gray-300 rounded px-0.5 py-0.5 inline-flex items-center">
              <Flag
                code={countryCodeMap[mentor.country]}
                style={{ width: 28, height: 18 }}
              />
            </div>
          </h2>
          <p className="text-base text-gray-600">📍 {mentor.location}</p>
          <p className="text-base text-gray-600">🗣️ {mentor.languages}</p>
          <p className="text-base text-gray-600">💼 {mentor.job}</p>
        </div>

        {/* bio表示（レスポンシブ時はここに出す） */}
        <div className="mt-3 text-gray-700 text-base">
          <p
            className={`${!expanded ? "line-clamp-4" : ""}`}
            style={{ whiteSpace: "pre-wrap" }}
          >
            {mentor.bio}
          </p>

          {mentor.bio.split("\n").join(" ").length > 100 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-blue-600 hover:underline mt-1 text-base font-medium"
            >
              {expanded ? "閉じる" : "続きを読む"}
            </button>
          )}
        </div>

        {/* ③ レスポンシブ時のみここに評価・実績・価格 */}
        <div className="flex flex-row justify-between items-center mt-4 md:hidden">
          {/* 評価・実績 */}
          <div className="flex flex-col items-start text-sm text-gray-500">
            <div className="flex items-center text-yellow-500 font-medium">
              <svg
                className="w-5 h-5 mr-1 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.567-.955L10 0l2.945 5.955 6.567.955-4.756 4.635 1.122 6.545z" />
              </svg>
              {mentor.rating}
            </div>
            <p>{mentor.reviews}件の実績</p>
          </div>

          {/* 価格 */}
          <div className="text-right">
            <div className="text-lg font-bold">{mentor.price}</div>
            <div className="text-sm text-gray-500">25分の料金</div>
          </div>
        </div>
      </div>

      {/* ③ PC時のみ表示の詳細エリア */}
      <div className="hidden md:flex flex-col justify-between text-right min-w-[160px]">
        <div className="flex justify-between items-start gap-2">
          {/* レビュー */}
          <div className="flex flex-col items-start">
            <div className="flex items-center text-base text-yellow-500 font-medium">
              <svg
                className="w-5 h-5 mr-1 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.567-.955L10 0l2.945 5.955 6.567.955-4.756 4.635 1.122 6.545z" />
              </svg>
              {mentor.rating}
            </div>
            <p className="text-sm text-gray-500">{mentor.reviews}件の実績</p>
          </div>

          {/* 価格 */}
          <div className="text-right">
            <p className="text-lg font-bold">{mentor.price}</p>
            <p className="text-sm text-gray-500">25分の料金</p>
          </div>
        </div>

        {/* 予約ボタン */}
        <button
          onClick={onBook}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-base mt-auto"
        >
          予約する
        </button>
      </div>

      {/* ③ レスポンシブ時のみ予約ボタン */}
      <button
        onClick={onBook}
        className="md:hidden bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-base mt-4 w-full"
      >
        予約する
      </button>
    </div>
  );
}
