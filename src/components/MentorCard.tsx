import { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';
import Flag from 'react-world-flags';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { FavoriteToggleButton } from '@/features/favorites/components/FavoriteToggleButton';
import { PriceDisplay } from '@/features/currency/components/PriceDisplay';
import type { MentorListItem } from '@/features/mentors/types';
import { getMentorProfilePhoto } from '@/lib/mentorProfilePhotos';

type MentorCardProps = {
  mentor: MentorListItem;
  onBook: () => void;
};

export default function MentorCard({ mentor, onBook }: MentorCardProps) {
  const t = useTranslations('mentors');
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const introductionRef = useRef<HTMLParagraphElement>(null);
  const fallbackPhoto = getMentorProfilePhoto(mentor.id);
  const avatarSrc = mentor.avatarUrl ?? fallbackPhoto.src;

  useEffect(() => {
    const introduction = introductionRef.current;

    if (!introduction || !mentor.introduction?.trim()) {
      setCanExpand(false);
      return;
    }

    const measureOverflow = () => {
      const hadLineClamp = introduction.classList.contains('line-clamp-4');

      if (!hadLineClamp) {
        introduction.classList.add('line-clamp-4');
      }

      setCanExpand(introduction.scrollHeight > introduction.clientHeight + 1);

      if (!hadLineClamp) {
        introduction.classList.remove('line-clamp-4');
      }
    };

    measureOverflow();

    const resizeObserver = new ResizeObserver(measureOverflow);
    resizeObserver.observe(introduction);

    return () => {
      resizeObserver.disconnect();
    };
  }, [mentor.introduction]);

  return (
    <Link href={`/mentors/${mentor.id}`} className="block">
      <div className="relative flex flex-col items-stretch gap-4 rounded-xl border-border bg-surface p-4 shadow transition-colors hover:bg-surface-hover sm:p-5 md:min-h-[220px] md:flex-row md:gap-8 md:p-8">
        <FavoriteToggleButton
          mentorId={mentor.id}
          className="absolute right-3 top-3 z-10 h-10 w-10 rounded-full bg-white/95 shadow-sm hover:bg-white md:right-4 md:top-4"
        />

        <div className="flex min-w-0 gap-4 pr-12 md:contents">
          <div className="relative h-24 w-24 flex-shrink-0 sm:h-28 sm:w-28 md:h-32 md:w-32">
            <Image
              src={avatarSrc}
              alt={mentor.name}
              fill
              className="rounded-lg object-cover object-center"
              sizes="(min-width: 768px) 128px, (min-width: 640px) 112px, 96px"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold md:text-2xl">
                <div className="break-words text-accent">{mentor.name}</div>
                <div className="inline-flex items-center rounded border border-border px-0.5 py-0.5">
                  <Flag
                    code={mentor.countryCode}
                    style={{ width: 28, height: 18 }}
                  />
                </div>
              </h2>
              <p className="break-words text-sm text-secondary sm:text-base md:text-base">
                💼 {mentor.headline}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 md:hidden">
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                  <svg
                    className="h-4 w-4 flex-shrink-0 fill-current text-yellow-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.567-.955L10 0l2.945 5.955 6.567.955-4.756 4.635 1.122 6.545z" />
                  </svg>
                  <span>{mentor.rating}</span>
                </div>
                <p className="mt-0.5 break-words text-xs leading-4 text-muted">
                  {t('reviews', { count: mentor.reviewCount })}
                </p>
              </div>
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold leading-5 text-primary">
                  {t('lessonDuration')}
                </p>
              </div>
              <div className="min-w-0 text-right">
                <PriceDisplay
                  amountUSD={mentor.hourlyRate}
                  className="text-sm font-bold text-primary sm:text-base"
                  showHelper={false}
                />
              </div>
            </div>

            {/* introduction */}
            <div className="mt-3 min-w-0 text-sm text-primary sm:text-base md:text-base">
              <p
                ref={introductionRef}
                className={`${!expanded ? 'line-clamp-4' : ''} break-words md:break-all`}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {mentor.introduction}
              </p>
              {canExpand && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  className="mt-1 text-sm font-medium text-accent hover:underline sm:text-base"
                >
                  {expanded ? t('showLess') : t('readMore')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PC時のみ詳細エリア */}
        <div className="hidden min-w-[160px] flex-col items-stretch justify-end gap-5 pt-10 text-right md:flex">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col items-start justify-end">
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
              <p className="text-sm text-muted">{t('reviews', { count: mentor.reviewCount })}</p>
            </div>
            <div className="flex flex-col items-end justify-end text-right">
              <PriceDisplay amountUSD={mentor.hourlyRate} className="text-lg font-bold text-primary" showHelper={false} />
              <p className="text-sm text-muted">{t('lessonDuration')}</p>
            </div>
          </div>

          {/* 予約ボタン */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBook();
            }}
            className="mt-0 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-base font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            <Zap className="h-5 w-5" />
            {t('bookLesson')}
          </button>
        </div>

        {/* SP用 予約ボタン */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBook();
          }}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-accent-hover md:hidden"
        >
          <Zap className="h-5 w-5" />
          {t('bookLesson')}
        </button>
      </div>
    </Link>
  );
}
