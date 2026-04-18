import Image from "next/image";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { ReservationData } from "../types/reservation";
import { Globe } from "lucide-react";
import Flag from "react-world-flags";
import { countryCodeMap } from "@/lib/countryCodeMap";
import { PriceDisplay } from "@/features/currency/components/PriceDisplay";

export const ReservationSummary = ({
  reservation,
  amountCents,
}: {
  reservation: ReservationData;
  amountCents: number | null;
}) => {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const { mentorName, mentorAvatarUrl, mentorCountry, duration, date, time, hourlyRate } =
    reservation;

  // hourlyRateはドル単位、durationは分単位
  const lessonFeeUSD = hourlyRate * (duration / 60);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        {mentorAvatarUrl && (
          <div className="relative h-20 w-20 overflow-hidden rounded-xl">
            <Image
              src={mentorAvatarUrl}
              alt={mentorName}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{mentorName}</h2>
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
            <span className="text-sm text-gray-500">{t("lesson")}</span>
            <span className="text-base font-medium">{t("duration", { duration })}</span>
          </div>
          <div className="border-l h-12 border-gray-300"></div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">{t("date")}</span>
            <span className="text-base font-medium">
              {new Date(date).toLocaleDateString(locale, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="border-l h-12 border-gray-300"></div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">{t("time")}</span>
            <span className="text-base font-medium">{time} -</span>
            <span className="text-xs text-gray-400">{t("timezone")}</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <h3 className="text-lg font-semibold">{t("orderSummary")}</h3>
        <div className="flex justify-between text-base">
          <span>{t("lessonFee", { duration })}</span>
          <PriceDisplay amountUSD={lessonFeeUSD} showHelper={false} />
        </div>
        <div className="flex justify-between text-lg font-semibold border-t pt-2">
          <span>{t("total")}</span>
          <PriceDisplay amountUSD={amountCents != null ? amountCents / 100 : lessonFeeUSD} />
        </div>
        <p className="text-xs text-gray-400 text-right">{t("chargedInUsd")}</p>
      </div>
    </div>
  );
};
