"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PRIMARY_PILL_BUTTON_LARGE_CLASS_NAME } from "@/components/ui/buttonStyles";
import { useCurrency } from "@/features/currency/context/CurrencyContext";
import { mentorProfilePhotos } from "@/lib/mentorProfilePhotos";
import { MentorCard } from "./MentorCard";

const mentorCards = [
  {
    avatarAlt: mentorProfilePhotos.minaLee.alt,
    avatarSrc: mentorProfilePhotos.minaLee.src,
    basePrice: 18,
    mentorKey: "aiko",
  },
  {
    avatarAlt: mentorProfilePhotos.danielPark.alt,
    avatarSrc: mentorProfilePhotos.danielPark.src,
    basePrice: 36,
    mentorKey: "marcus",
  },
  {
    avatarAlt: mentorProfilePhotos.rahulSharma.alt,
    avatarSrc: mentorProfilePhotos.rahulSharma.src,
    basePrice: 24,
    mentorKey: "sofia",
  },
] as const;
const mentorListHref = "/mentors";

export function MentorPreviewSection() {
  const t = useTranslations("landing.mentors");
  const { currency } = useCurrency();

  return (
    <section className="py-4 sm:py-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">
            {t("eyebrow")}
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
            {t("description")}
          </p>
        </div>

        <Link
          href={mentorListHref}
          className={PRIMARY_PILL_BUTTON_LARGE_CLASS_NAME}
        >
          {t("browseCta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
        {mentorCards.map((mentor) => (
          <MentorCard
            key={mentor.mentorKey}
            avatarAlt={mentor.avatarAlt}
            avatarSrc={mentor.avatarSrc}
            basePrice={mentor.basePrice}
            currency={currency}
            mentorKey={mentor.mentorKey}
          />
        ))}
      </div>
    </section>
  );
}
