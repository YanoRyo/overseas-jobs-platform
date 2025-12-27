import { ReservationData } from "../types/reservation";
import { Globe, Star } from "lucide-react";
import Flag from "react-world-flags";
import { countryCodeMap } from "@/lib/countryCodeMap";

export const ReservationSummary = ({
  reservation,
}: {
  reservation: ReservationData;
}) => {
  const { mentorName, mentorAvatarUrl, mentorCountry, duration, date, time } =
    reservation;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        {mentorAvatarUrl && (
          <img
            src={mentorAvatarUrl}
            alt={mentorName}
            className="w-20 h-20 rounded-xl object-cover"
          />
        )}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{mentorName} さん</h2>
            {mentorCountry && countryCodeMap[mentorCountry] ? (
              <div className="border border-gray-300 rounded px-0.5 py-0.5 inline-flex items-center">
                <Flag
                  code={countryCodeMap[mentorCountry]}
                  style={{ width: 28, height: 18 }}
                />
              </div>
            ) : (
              <Globe className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Star className="w-4 h-4 text-yellow-500" />
            4.8（32件）
          </div>
          <p className="text-sm text-gray-700 mt-1">
            元GoogleのUXデザイナー。海外就職・英語学習のアドバイスが得意です。
          </p>
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button className="px-3 py-2 rounded-lg border border-gray-300 font-medium">
              25分
            </button>
            <span className="text-gray-600">¥1,925</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-3 py-2 rounded-lg border border-gray-300 font-medium">
              50分
            </button>
            <span className="text-gray-600">¥3,850</span>
          </div>
        </div>

        <div className="flex items-start gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">日付</span>
            <span className="text-base font-medium">
              {new Date(date).toLocaleDateString("ja-JP")}
            </span>
          </div>
          <div className="border-l h-12 border-gray-300"></div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">時間</span>
            <span className="text-base font-medium">{time}〜</span>
            <span className="text-xs text-gray-400">JST（GMT+9）</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <h3 className="text-lg font-semibold">ご注文</h3>
        <div className="flex justify-between text-base">
          <span>レッスン料金（{duration}分）</span>
          <span>¥{duration === 50 ? "3,850" : "1,925"}</span>
        </div>
        <div className="flex justify-between text-base">
          <span>決済手数料</span>
          <span>¥100</span>
        </div>
        <div className="flex justify-between text-lg font-semibold border-t pt-2">
          <span>合計金額</span>
          <span>¥{duration === 50 ? "3950" : "2025"}</span>
        </div>
      </div>
    </div>
  );
};
