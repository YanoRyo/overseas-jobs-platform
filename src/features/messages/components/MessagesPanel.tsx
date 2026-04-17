"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import type { MessageTab } from "@/features/messages/types/messageTab";
import type { ConversationItem as ConversationItemType } from "../types/conversationItem";

import { ConversationList } from "./ConversationList";
import { ConversationDetail } from "./ConversationDetail";

export function MessagesPanel({ onClose }: { onClose: () => void }) {
  const t = useTranslations("messages");
  const tc = useTranslations("common");
  const [activeTab, setActiveTab] = useState<MessageTab>("all");
  const [activeConversation, setActiveConversation] =
    useState<ConversationItemType | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/10" onClick={onClose}>
      <div className="flex h-full items-start justify-end p-2 pt-20 sm:p-4 sm:pt-20">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("title")}
          className="flex h-[calc(100dvh-5.5rem)] w-full min-h-0 max-w-[520px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:h-[min(720px,calc(100dvh-6rem))]"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
            <h2 className="truncate text-base font-semibold">
              {activeConversation ? activeConversation.partnerName : t("title")}
            </h2>

            <button type="button" aria-label={tc("close")} onClick={onClose}>
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          {activeConversation ? (
            <div className="min-h-0 flex-1 overflow-hidden">
              <ConversationDetail
                conversation={activeConversation}
                onBack={() => setActiveConversation(null)}
              />
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex shrink-0 gap-6 border-b px-5 py-3 text-sm">
                <TabButton
                  active={activeTab === "all"}
                  onClick={() => setActiveTab("all")}
                >
                  {t("all")}
                </TabButton>
                <TabButton
                  active={activeTab === "unread"}
                  onClick={() => setActiveTab("unread")}
                >
                  {t("unread")}
                </TabButton>
              </div>

              {/* List */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ConversationList
                  tab={activeTab}
                  onSelectConversation={(c) => setActiveConversation(c)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pb-2 transition-colors ${
        active
          ? "border-b-2 border-[#2563eb] font-semibold text-[#2563eb]"
          : "text-gray-400 hover:text-[#2563eb]"
      }`}
    >
      {children}
    </button>
  );
}
