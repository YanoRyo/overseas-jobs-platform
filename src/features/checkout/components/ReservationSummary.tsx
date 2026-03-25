import { ReservationData } from "../types/reservation";
import { Globe, Star } from "lucide-react";
import Flag from "react-world-flags";
import { countryCodeMap } from "@/lib/countryCodeMap";

export const ReservationSummary = ({
  reservation,
  amountCents,
}: {
  reservation: ReservationData;
  amountCents: number | null;
}) => {
  const { mentorName, mentorAvatarUrl, mentorCountry, duration, date, time, hourlyRate } =
    reservation;

  const formatUsd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // hourlyRateはドル単位、durationは分単位
  const lessonFeeCents = Math.round(hourlyRate * (duration / 60) * 100);

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
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <div className="flex items-start gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">レッスン</span>
            <span className="text-base font-medium">{duration}分</span>
          </div>
          <div className="border-l h-12 border-gray-300"></div>
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
          <span>{formatUsd(lessonFeeCents)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold border-t pt-2">
          <span>合計金額</span>
          <span>{amountCents != null ? formatUsd(amountCents) : formatUsd(lessonFeeCents)}</span>
        </div>
      </div>
    </div>
  );
};
