"use client";

import Image from "next/image";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  PRIMARY_PILL_BUTTON_LARGE_CLASS_NAME,
  SECONDARY_PILL_BUTTON_CLASS_NAME,
} from "@/components/ui/buttonStyles";
import { mentorProfilePhotos } from "@/lib/mentorProfilePhotos";

const floatingCardKeys = ["match", "review", "availability"] as const;
const highlightKeys = ["careerSwitch", "visaSupport", "firstSession"] as const;
const floatingCardAvatars = [
  mentorProfilePhotos.kenSato,
  mentorProfilePhotos.minaLee,
  mentorProfilePhotos.danielPark,
] as const;
const mentorListHref = "/mentors";

type FloatingCardProps = {
  avatarAlt: string;
  avatarSrc: string;
  eyebrow: string;
  title: string;
  description: string;
  className: string;
};

function FloatingCard({
  avatarAlt,
  avatarSrc,
  eyebrow,
  title,
  description,
  className,
}: FloatingCardProps) {
  return (
    <div
      className={`absolute z-10 w-[10.75rem] rounded-2xl border border-white/80 bg-white/92 p-4 shadow-lg shadow-sky-100/60 backdrop-blur sm:w-48 ${className}`}
    >
      <div className="flex items-center gap-3">
        <Image
          src={avatarSrc}
          alt={avatarAlt}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover object-center"
        />
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
            {title}
          </p>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-sky-500">
            {eyebrow}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}

export function HeroSection() {
  const t = useTranslations("landing.hero");

  const floatingCards = floatingCardKeys.map((key, index) => ({
    avatarAlt: floatingCardAvatars[index].alt,
    avatarSrc: floatingCardAvatars[index].src,
    eyebrow: t(`cards.${key}.eyebrow`),
    title: t(`cards.${key}.title`),
    description: t(`cards.${key}.description`),
  }));

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-sky-100/80 bg-white/75 px-6 py-10 shadow-[0_30px_80px_-48px_rgba(14,116,144,0.42)] backdrop-blur sm:px-8 sm:py-12 lg:px-12 lg:py-16">
      <div
        aria-hidden="true"
        className="absolute inset-x-12 top-0 h-28 rounded-full bg-white/90 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -left-20 top-10 h-48 w-48 rounded-full bg-sky-100/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-16 bottom-0 h-52 w-52 rounded-full bg-cyan-100/60 blur-3xl"
      />

      <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/90 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
            {t("eyebrow")}
          </div>

          <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
            {t("title")}
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            {t("description")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={mentorListHref}
              className={PRIMARY_PILL_BUTTON_LARGE_CLASS_NAME}
            >
              {t("primaryCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className={SECONDARY_PILL_BUTTON_CLASS_NAME}
            >
              <PlayCircle className="h-4 w-4" />
              {t("secondaryCta")}
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {highlightKeys.map((key) => (
              <div
                key={key}
                className="rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm"
              >
                {t(`highlights.${key}`)}
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[34rem]">
          <div
            aria-hidden="true"
            className="absolute inset-x-6 top-8 h-20 rounded-full bg-sky-100/80 blur-3xl"
          />

          <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-3 shadow-[0_28px_80px_-36px_rgba(2,132,199,0.35)]">
            <Image
              src="/onboarding-hero-illustration.svg"
              alt={t("visualAlt")}
              width={640}
              height={560}
              priority
              className="h-auto w-full rounded-[1.65rem]"
            />
          </div>

          <FloatingCard
            {...floatingCards[0]}
            className="left-3 top-4 sm:-left-8 sm:top-10"
          />
          <FloatingCard
            {...floatingCards[1]}
            className="right-3 top-20 sm:-right-8 sm:top-24"
          />
          <FloatingCard
            {...floatingCards[2]}
            className="bottom-4 left-6 sm:bottom-8 sm:left-10"
          />
        </div>
      </div>
    </section>
  );
}
