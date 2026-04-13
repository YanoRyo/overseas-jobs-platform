"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { MessageCircle } from "lucide-react";
import { MessagesPanel } from "@/features/messages/components/MessagesPanel";
import { useUnreadCount } from "@/features/messages/hooks/useUnreadCount";

export default function MessageBox() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { unreadCount } = useUnreadCount();
  const pathWithoutLocale = pathname?.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "";
  const isMessagesPage =
    pathWithoutLocale === "/settings" && searchParams.get("tab") === "messages";
  const highlighted = open || isMessagesPage;

  // ページ遷移（pathが変わったら）必ず閉じる
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative">
      <button
        type="button"
        className={`relative rounded-full p-2 transition-colors ${
          highlighted
            ? "bg-[#eff6ff] text-[#2563eb]"
            : "text-[#4f7bff] hover:bg-[#eff6ff] hover:text-[#2563eb]"
        }`}
        aria-label="messages"
        onClick={() => setOpen((v) => !v)}
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-xs text-white bg-red-500 rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && <MessagesPanel onClose={() => setOpen(false)} />}
    </div>
  );
}
