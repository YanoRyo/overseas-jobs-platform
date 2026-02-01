"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { MessagesPanel } from "@/features/messages/components/MessagesPanel";
import { useUnreadCount } from "@/features/messages/hooks/useUnreadCount";

export default function MessageBox() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname(); // ★
  const { unreadCount } = useUnreadCount();

  // ページ遷移（pathが変わったら）必ず閉じる
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative">
      <button
        type="button"
        className="relative p-2 rounded-full hover:bg-gray-100"
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
