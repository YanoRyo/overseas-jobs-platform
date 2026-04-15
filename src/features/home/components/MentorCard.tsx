"use client";

import Image from "next/image";
import { CalendarDays, Star } from "lucide-react";
import { useTranslations } from "next-intl";

type MentorCardKey = "aiko" | "marcus" | "sofia";

export type MentorPreviewCardProps = {
  avatarAlt: string;
  avatarSrc: string;
  mentorKey: MentorCardKey;
};

const tagKeys = ["first", "second", "third"] as const;

export function MentorCard({
  avatarAlt,
  avatarSrc,
  mentorKey,
}: MentorPreviewCardProps) {
  const t = useTranslations("landing.mentors");

  return (
    <article className="flex h-full flex-col rounded-[1.9rem] border border-slate-200/80 bg-white/80 p-5 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.45)] backdrop-blur sm:p-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src={avatarSrc}
              alt={avatarAlt}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover"
            />

            <div className="min-w-0">
              <h3 className="truncate text-xl font-semibold text-slate-950">
                {t(`cards.${mentorKey}.name`)}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {t(`cards.${mentorKey}.role`)}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-600">
                <Star className="h-4 w-4 fill-current" />
                {t(`cards.${mentorKey}.rating`)}
              </div>
            </div>
          </div>

          <div className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            {t(`cards.${mentorKey}.badge`)}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {tagKeys.map((tagKey) => (
            <span
              key={tagKey}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
            >
              {t(`cards.${mentorKey}.tags.${tagKey}`)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="line-clamp-4 text-sm leading-7 text-slate-600">
          {t(`cards.${mentorKey}.summary`)}
        </p>
      </div>

      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
          <div>
            <p className="text-lg font-semibold text-slate-950">
              {t(`cards.${mentorKey}.price`)}
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {t("priceLabel")}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
            <CalendarDays className="h-4 w-4" />
            {t(`cards.${mentorKey}.availability`)}
          </div>
        </div>
      </div>
    </article>
  );
}
