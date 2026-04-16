"use client";

import { useState } from "react";
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

  return (
    <div
      className="
        fixed top-16 right-4 z-50
        w-[520px]
        h-[80vh] max-h-[720px]
        bg-white border border-gray-200
        rounded-xl shadow-xl
        flex flex-col overflow-hidden
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h2 className="text-base font-semibold truncate">
          {activeConversation ? activeConversation.partnerName : t("title")}
        </h2>

        <button aria-label={tc("close")} onClick={onClose}>
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Body */}
      {activeConversation ? (
        <ConversationDetail
          conversation={activeConversation}
          onBack={() => setActiveConversation(null)}
        />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-6 px-5 py-3 text-sm border-b">
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
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              tab={activeTab}
              onSelectConversation={(c) => setActiveConversation(c)}
            />
          </div>
        </>
      )}
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
