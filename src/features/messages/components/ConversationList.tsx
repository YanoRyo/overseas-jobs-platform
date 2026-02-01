"use client";

import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";

import { ConversationItem } from "./ConversationItem";
import { useMessageThreads } from "../hooks/useMessageThreads";
import type { MessageTab } from "@/features/messages/types/messageTab";
import type { ConversationItem as ConversationItemType } from "../types/conversationItem";

export function ConversationList({
  tab,
  onSelectConversation,
}: {
  tab: MessageTab;
  onSelectConversation: (c: ConversationItemType) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { items, loading, emptyReason } = useMessageThreads(tab);

  const redirectParam = useMemo(
    () => encodeURIComponent(pathname || "/"),
    [pathname]
  );

  // 未ログイン時：ログイン/新規登録導線を表示
  if (emptyReason === "not_logged_in") {
    return (
      <div className="px-4 py-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-3 text-sm text-yellow-800">
          Please sign up or log in to view your messages.
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() =>
                router.push(`/auth/login?redirect=${redirectParam}`)
              }
              className="px-3 py-1 rounded-md bg-yellow-700 text-white text-xs font-semibold"
            >
              Log In
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(`/auth/signup?redirect=${redirectParam}`)
              }
              className="px-3 py-1 rounded-md border border-yellow-700 text-yellow-800 text-xs font-semibold"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="px-4 py-6 text-sm text-gray-400">Loading...</div>;
  }

  const conversations = items.filter((c) => {
    if (tab === "all") return true;
    if (tab === "unread") return c.unread;
    return true;
  });

  if (conversations.length === 0) {
    return <div className="px-4 py-6 text-sm text-gray-400">No messages</div>;
  }

  return (
    <>
      {conversations.map((c) => (
        <ConversationItem
          key={c.id}
          conversation={c}
          onClick={() => onSelectConversation(c)}
        />
      ))}
    </>
  );
}
