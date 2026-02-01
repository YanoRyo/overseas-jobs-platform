"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ConversationItem as ConversationItemType } from "../types/conversationItem";

export function ConversationItem({
  conversation,
  onClick,
}: {
  conversation: ConversationItemType;
  onClick: () => void;
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
      className="flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b"
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
          <p className="text-sm font-medium truncate">
            {conversation.partnerName}
          </p>

          <div
            className="relative flex flex-col items-end gap-1 leading-none"
            ref={menuRef}
          >
            <span className="text-xs text-gray-400">
              {conversation.updatedAt}
            </span>
          </div>
        </div>

        {/* 下段 */}
        <div className="flex justify-between items-center gap-2 mt-1">
          <p className="text-xs text-gray-500 truncate">
            {conversation.lastMessage}
          </p>

          {conversation.unreadCount > 0 && (
            <span className="min-w-[20px] h-5 px-1 text-xs text-white bg-red-500 rounded-full flex items-center justify-center">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
