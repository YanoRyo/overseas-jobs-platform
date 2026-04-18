"use client";

import {
  Compass,
  Map,
  MessageSquareQuote,
  SearchCheck,
  CalendarDays,
  ArrowRightLeft,
} from "lucide-react";
import { useTranslations } from "next-intl";

const problemCardKeys = ["noise", "uncertainty", "momentum"] as const;
const solutionStepKeys = ["browse", "compare", "book"] as const;

const problemIcons = [Compass, Map, MessageSquareQuote] as const;
const solutionIcons = [SearchCheck, ArrowRightLeft, CalendarDays] as const;

export function ProblemSection() {
  const t = useTranslations("landing.problem");

  return (
    <section id="how-it-works" className="scroll-mt-24 py-4 sm:py-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-start">
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

        <div className="rounded-[2rem] border border-sky-100 bg-white/80 p-6 shadow-[0_24px_70px_-48px_rgba(14,116,144,0.42)] backdrop-blur sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-500">
            {t("solution.eyebrow")}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-950">
            {t("solution.title")}
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            {t("solution.description")}
          </p>

          <div className="mt-6 space-y-3">
            {solutionStepKeys.map((key, index) => {
              const Icon = solutionIcons[index];

              return (
                <div
                  key={key}
                  className="flex items-start gap-4 rounded-2xl bg-sky-50/80 p-4"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {t(`steps.${key}.title`)}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {t(`steps.${key}.description`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {problemCardKeys.map((key, index) => {
          const Icon = problemIcons[index];

          return (
            <article
              key={key}
              className="rounded-[1.75rem] border border-slate-200/80 bg-white/70 p-6 shadow-[0_20px_60px_-50px_rgba(15,23,42,0.45)] backdrop-blur"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">
                {t(`cards.${key}.eyebrow`)}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">
                {t(`cards.${key}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                {t(`cards.${key}.description`)}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
