"use client";

import { useEffect } from "react";
import Image from "next/image";
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
  const supabase = useSupabaseClient();

  const avatarUrl =
    conversation.partnerAvatarUrl && conversation.partnerAvatarUrl.trim() !== ""
      ? conversation.partnerAvatarUrl
      : null;

  const { messages, loading, sending, error, send, currentUserId, retry } =
    useMessages(conversation.id, conversation.partnerId);

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
    <div className="flex flex-col h-full">
      {/* Sub header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
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

      {/* body */}
      {loading ? (
        <div className="p-4 text-sm text-gray-400">Loading...</div>
      ) : (
        <MessageThread
          messages={messages}
          currentUserId={currentUserId}
          onRetry={(clientId) => retry(clientId)}
        />
      )}

      {error && <div className="px-4 pb-2 text-xs text-red-500">{error}</div>}

      {/* input */}
      <MessageInput onSend={(t) => send(t)} sending={sending} />
    </div>
  );
}
