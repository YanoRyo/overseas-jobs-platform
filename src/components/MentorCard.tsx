import { useState } from 'react';
import Flag from 'react-world-flags';
import Image from 'next/image';
import Link from 'next/link';
import { FavoriteToggleButton } from '@/features/favorites/components/FavoriteToggleButton';
import type { MentorListItem } from '@/features/mentors/types';

type MentorCardProps = {
  mentor: MentorListItem;
  onBook: () => void;
};

export default function MentorCard({ mentor, onBook }: MentorCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Link href={`/mentors/${mentor.id}`} className="block">
      <div className="relative flex min-h-[220px] flex-col items-stretch gap-8 rounded-xl border-border bg-surface p-8 shadow transition-colors hover:bg-surface-hover md:flex-row">
        <FavoriteToggleButton
          mentorId={mentor.id}
          className="absolute right-4 top-4 z-10 h-10 w-10 rounded-full bg-white/95 shadow-sm hover:bg-white"
        />

        {/* アバター */}
        <div className="relative w-32 h-32 flex-shrink-0">
          {mentor.avatarUrl && (
            <Image
              src={mentor.avatarUrl}
              alt={mentor.name}
              fill
              className="object-cover rounded-lg"
            />
          )}
        </div>

        {/* テキスト情報 */}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <div className="hover:underline text-accent">{mentor.name}</div>
              <div className="border border-border rounded px-0.5 py-0.5 inline-flex items-center">
                <Flag
                  code={mentor.countryCode}
                  style={{ width: 28, height: 18 }}
                />
              </div>
            </h2>
            <p className="break-words text-base text-secondary">
              💼 {mentor.headline}
            </p>
          </div>

          {/* introduction */}
          <div className="mt-3 text-primary text-base">
            <p
              className={`${!expanded ? 'line-clamp-4' : ''}`}
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {mentor.introduction}
            </p>
            {mentor.introduction?.split('\n').join(' ').length > 100 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="text-accent hover:underline mt-1 text-base font-medium"
              >
                {expanded ? '閉じる' : '続きを読む'}
              </button>
            )}
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
              <p className="text-sm text-muted">{mentor.reviewCount}件の実績</p>
            </div>
            <div className="flex flex-col items-end justify-end text-right">
              <p className="text-lg font-bold text-primary">${mentor.hourlyRate}</p>
              <p className="text-sm text-muted">50分の料金</p>
            </div>
          </div>

          {/* 予約ボタン */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBook();
            }}
            className="mt-0 rounded-lg bg-accent px-4 py-2 text-base text-white transition-colors hover:bg-accent-hover"
          >
            予約する
          </button>
        </div>

        {/* SP用 予約ボタン */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBook();
          }}
          className="md:hidden bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-base mt-4 w-full transition-colors"
        >
          予約する
        </button>
      </div>
    </Link>
  );
}
