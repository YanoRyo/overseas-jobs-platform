"use client";

import Link from "next/link";

export function MentorRegistrationCallout() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-[#1d4ed8]">
          メンター登録情報が未入力です
        </p>
        <p className="mt-1 text-sm text-[#475569]">
          メンター登録画面でプロフィールを入力すると、メンター向け機能を利用できます。
        </p>
      </div>
      <Link
        href="/mentor/register"
        className="inline-flex items-center justify-center rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
      >
        メンター登録情報を入力
      </Link>
    </div>
  );
}
