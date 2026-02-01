"use client";

import type { Message } from "../types/message";

export function MessageThread({
  messages,
  currentUserId,
  onRetry,
}: {
  messages: Message[];
  currentUserId: string | null;
  onRetry?: (clientId: string) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {messages.map((m) => {
        const isMe = currentUserId === m.sender_id;

        const timeLabel =
          m.status === "pending"
            ? "Sending..."
            : m.status === "failed"
            ? "Failed to send"
            : new Date(m.created_at).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              });

        return (
          <div
            key={m.client_id ?? String(m.id)}
            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                isMe ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-900"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.body}</div>

              <div className="mt-1 flex items-center gap-2">
                <div
                  className={`text-[10px] ${
                    isMe ? "text-white" : "text-gray-500"
                  }`}
                >
                  {timeLabel}
                </div>

                {/* 再送ボタン（failed のときだけ） */}
                {isMe && m.status === "failed" && m.client_id && onRetry && (
                  <button
                    type="button"
                    onClick={() => onRetry(m.client_id!)}
                    className="text-[10px] underline text-white/80 hover:text-white"
                  >
                    Resend
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
