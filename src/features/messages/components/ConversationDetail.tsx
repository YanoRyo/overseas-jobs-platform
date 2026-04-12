"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

import type { ConversationItem } from "../types/conversationItem";
import { useMessages } from "../hooks/useMessages";
import { MessageThread } from "./MessageThread";
import { MessageInput } from "./MessageInput";

export function ConversationDetail({
  conversation,
  onBack,
}: {
  conversation: ConversationItem;
  onBack: () => void;
}) {
  const tc = useTranslations("common");
  const supabase = useSupabaseClient();

  const avatarUrl =
    conversation.partnerAvatarUrl && conversation.partnerAvatarUrl.trim() !== ""
      ? conversation.partnerAvatarUrl
      : null;

  const { messages, loading, sending, error, send, currentUserId, retry } =
    useMessages(conversation.id);

  /**
   * 開いた瞬間に「自分を unread_by から外す」
   */
  useEffect(() => {
    if (!currentUserId) return;

    const markAsRead = async () => {
      const { error } = await supabase.rpc("mark_conversation_as_read", {
        p_conversation_id: conversation.id,
        p_user_id: currentUserId,
      });

      if (error) console.error("markAsRead error", error);
    };

    markAsRead();
  }, [supabase, conversation.id, currentUserId]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 flex items-center gap-3 border-b px-4 py-3">
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ←
        </button>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative w-7 h-7 rounded-lg overflow-hidden">
            <Image
              src={avatarUrl ?? "/avatar-placeholder.png"}
              alt={conversation.partnerName}
              fill
              className={`object-cover ${avatarUrl ? "" : "opacity-70"}`}
              sizes="28px"
            />
          </div>
          <div className="text-sm font-medium">{conversation.partnerName}</div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center px-4 text-sm text-gray-400">
            {tc("loading")}
          </div>
        ) : (
          <MessageThread
            messages={messages}
            currentUserId={currentUserId}
            onRetry={(clientId) => retry(clientId)}
          />
        )}
      </div>

      <div className="shrink-0 border-t bg-white">
        {error && <div className="px-4 pt-3 text-xs text-red-500">{error}</div>}
        <MessageInput onSend={(t) => send(t)} sending={sending} />
      </div>
    </div>
  );
}
