"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ConversationItem as ConversationItemType } from "../types/conversationItem";

export function ConversationItem({
  conversation,
  onClick,
  selected = false,
}: {
  conversation: ConversationItemType;
  onClick: () => void;
  selected?: boolean;
}) {
  const avatarUrl =
    conversation.partnerAvatarUrl && conversation.partnerAvatarUrl.trim() !== ""
      ? conversation.partnerAvatarUrl
      : null;

  // メニュー開閉
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 外側クリックで閉じる / Escで閉じる
  useEffect(() => {
    if (!menuOpen) return;

    const onDocMouseDown = (e: MouseEvent) => {
      const el = menuRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setMenuOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div
      onClick={() => {
        // メニューが開いてるときは行クリックで開かない方が安全
        if (menuOpen) return;
        onClick();
      }}
      className={`flex cursor-pointer gap-3 border-b px-4 py-4 transition ${
        selected ? "bg-[#eff6ff]" : "hover:bg-[#f8fbff]"
      }`}
    >
      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
        <Image
          src={avatarUrl ?? "/avatar-placeholder.png"}
          alt={conversation.partnerName}
          fill
          className={`object-cover ${avatarUrl ? "" : "opacity-70"}`}
          sizes="40px"
        />
      </div>

      <div className="flex-1 min-w-0">
        {/* 上段：左=名前 / 右=日時 + ⋯ */}
        <div className="flex justify-between items-start">
          <p
            className={`truncate text-sm ${
              conversation.unread || selected ? "font-semibold" : "font-medium"
            }`}
          >
            {conversation.partnerName}
          </p>

          <div
            className="relative flex flex-col items-end gap-1 leading-none"
            ref={menuRef}
          >
            <span
              className={`text-xs ${
                conversation.unread ? "font-medium text-[#1f1f2d]" : "text-gray-400"
              }`}
            >
              {conversation.updatedAt}
            </span>
          </div>
        </div>

        {/* 下段 */}
        <div className="flex justify-between items-center gap-2 mt-1">
          <p
            className={`truncate text-xs ${
              conversation.unread ? "text-[#1f1f2d]" : "text-gray-500"
            }`}
          >
            {conversation.lastMessage}
          </p>

          {conversation.unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#2563eb] px-1 text-xs text-white">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
