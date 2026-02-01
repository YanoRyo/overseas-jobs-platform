"use client";
import { usePathname } from "next/navigation";

import Link from "next/link";
import MessageBox from "./MessageBox";
import UserMenu from "./UserMenu";

export function Header() {
  const pathname = usePathname();
  const hideRight = pathname?.startsWith("/auth");
  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="flex items-center justify-between h-16 px-6">
        {/* 左：ロゴ */}
        <Link href="/" className="font-bold text-xl">
          Bridgee
        </Link>

        {/* 右：メッセージ・通知・ユーザー*/}
        {!hideRight && (
          <div className="flex items-center gap-4">
            <MessageBox />
            <UserMenu />
          </div>
        )}
      </div>
    </header>
  );
}
