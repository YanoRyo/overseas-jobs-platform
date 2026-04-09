"use client";

import { useState } from "react";
import Flag from "react-world-flags";

type Mentor = {
  id: string;
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
  skills: string[];
  detailedReviews: {
    id: string;
    user: string;
    rating: number;
    comment: string;
  }[];
  pricingPlans: { label: string; price: string; description?: string }[];
  snsLinks: { label: string; url: string; icon: React.ReactNode }[];
  faqs: { question: string; answer: string }[];
  availableSlots: string[]; // ISO文字列 or 時間表記など簡易的に
};

type MentorDetailProps = {
  mentor: Mentor;
  onBook: (slot?: string) => void;
};

const countryCodeMap: Record<string, string> = {
  Japan: "jp",
  "South Korea": "kr",
  USA: "us",
  Taiwan: "tw",
  Mexico: "mx",
};

export default function MentorDetail({ mentor, onBook }: MentorDetailProps) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
      {/* ヘッダー部分 */}
      <div className="flex flex-col md:flex-row gap-6">
        {mentor.avatarUrl && (
          <img
            src={mentor.avatarUrl}
            alt={mentor.name}
            className="w-40 h-40 rounded-lg object-cover mx-auto md:mx-0"
          />
        )}
        <div className="flex flex-col flex-1 justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {mentor.name}
              <div className="border border-gray-300 rounded px-1 py-0.5 inline-flex items-center">
                <Flag
                  code={countryCodeMap[mentor.country]}
                  style={{ width: 32, height: 20 }}
                />
              </div>
            </h1>
            <p className="text-gray-600 mt-1">📍 {mentor.location}</p>
            <p className="text-gray-600 mt-1">🗣️ {mentor.languages}</p>
            <p className="text-gray-600 mt-1">💼 {mentor.job}</p>
          </div>

          {/* スキルタグ */}
          <div className="mt-4 flex flex-wrap gap-2">
            {mentor.skills.map((skill) => (
              <span
                key={skill}
                className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* 価格・評価 */}
        <div className="text-right min-w-[160px] flex flex-col justify-between">
          <div>
            <div className="text-xl font-bold">{mentor.price}</div>
            <div className="text-xs text-gray-500 mt-1">25-minute lesson</div>
          </div>

          <div className="mt-6">
            <div className="flex items-center text-yellow-500 font-semibold text-lg">
              <svg
                className="w-6 h-6 mr-1 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.567-.955L10 0l2.945 5.955 6.567.955-4.756 4.635 1.122 6.545z" />
              </svg>
              {mentor.rating}
            </div>
            <p className="text-sm text-gray-600">{mentor.reviews} reviews</p>
          </div>
        </div>
      </div>

      {/* 自己紹介 */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-2">About</h2>
        <p
          className={`text-gray-700 whitespace-pre-wrap ${
            !bioExpanded ? "line-clamp-6" : ""
          }`}
        >
          {mentor.bio}
        </p>
        {mentor.bio.length > 200 && (
          <button
            onClick={() => setBioExpanded(!bioExpanded)}
            className="mt-2 text-blue-600 hover:underline"
          >
            {bioExpanded ? "Show less" : "Read more"}
          </button>
        )}
      </section>

      {/* 詳細レビュー */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>
        <ul className="space-y-4 max-h-64 overflow-y-auto">
          {mentor.detailedReviews.map((review) => (
            <li key={review.id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex items-center mb-1">
                <div className="font-semibold mr-2">{review.user}</div>
                <div className="flex items-center text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 fill-current ${
                        i < review.rating ? "text-yellow-500" : "text-gray-300"
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.567-.955L10 0l2.945 5.955 6.567.955-4.756 4.635 1.122 6.545z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 text-sm">{review.comment}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 料金プラン */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Pricing</h2>
        <ul className="space-y-3">
          {mentor.pricingPlans.map((plan, i) => (
            <li
              key={i}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-lg">{plan.label}</p>
                {plan.description && (
                  <p className="text-gray-600 text-sm mt-1">
                    {plan.description}
                  </p>
                )}
              </div>
              <div className="text-lg font-bold">{plan.price}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* 予約可能日時（簡易版） */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Available times</h2>
        <div className="grid grid-cols-3 gap-2 max-w-sm">
          {mentor.availableSlots.length === 0 && (
            <p className="text-gray-500">No available times right now.</p>
          )}
          {mentor.availableSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              className={`border rounded px-3 py-1 text-sm ${
                selectedSlot === slot
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-800 hover:bg-blue-100"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </section>

      {/* SNSリンク */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Social links</h2>
        <div className="flex gap-4">
          {mentor.snsLinks.map(({ label, url, icon }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              {icon}
              <span>{label}</span>
            </a>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">FAQ</h2>
        <div className="space-y-2">
          {mentor.faqs.map((faq, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setFaqOpenIndex(faqOpenIndex === i ? null : i)}
                className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 flex justify-between items-center"
              >
                <span>{faq.question}</span>
                <span>{faqOpenIndex === i ? "−" : "+"}</span>
              </button>
              {faqOpenIndex === i && (
                <div className="px-4 py-2 text-gray-700">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 予約ボタン */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => onBook(selectedSlot || undefined)}
          disabled={!selectedSlot}
          className={`bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed`}
        >
          {selectedSlot
            ? `Book Lesson (${selectedSlot})`
            : "Select a time"}
        </button>
      </div>
    </div>
  );
}
