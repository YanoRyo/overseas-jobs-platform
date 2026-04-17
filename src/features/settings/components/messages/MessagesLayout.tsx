"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import { AuthPromptCard } from "@/components/AuthPromptCard";
import { useAuthModal } from "@/features/auth/context/AuthModalProvider";
import { ConversationDetail } from "@/features/messages/components/ConversationDetail";
import { ConversationItem as ConversationListItem } from "@/features/messages/components/ConversationItem";
import { useMessageThreads } from "@/features/messages/hooks/useMessageThreads";
import { useUnreadCount } from "@/features/messages/hooks/useUnreadCount";
import type { MessageTab } from "@/features/messages/types/messageTab";
import type { ConversationItem } from "@/features/messages/types/conversationItem";

import { MentorRegistrationCallout } from "../MentorRegistrationCallout";
import { SettingsTopTabs } from "../SettingsTopTabs";

type Props = {
  role: "student" | "mentor";
  showMentorRegistrationCallout?: boolean;
};

export function MessagesLayout({ role, showMentorRegistrationCallout = false }: Props) {
  if (showMentorRegistrationCallout) {
    return (
      <div className="min-h-screen bg-white">
        <SettingsTopTabs role={role} activeTabId="messages" />

        <main className="mx-auto max-w-[1200px] px-6 py-10">
          <MentorRegistrationCallout />
        </main>
      </div>
    );
  }

  return <MessagesContent role={role} />;
}

function MessagesContent({
  role,
}: {
  role: Props["role"];
}) {
  const t = useTranslations("messages");
  const tc = useTranslations("common");
  const [activeTab, setActiveTab] = useState<MessageTab>("all");
  const [activeConversation, setActiveConversation] =
    useState<ConversationItem | null>(null);
  const [mobileConversation, setMobileConversation] =
    useState<ConversationItem | null>(null);
  const { unreadCount } = useUnreadCount();
  const { items, loading, emptyReason } = useMessageThreads(activeTab);
  const { openAuthModal } = useAuthModal();

  const conversations = useMemo(
    () =>
      items.filter((conversation) =>
        activeTab === "unread" ? conversation.unread : true
      ),
    [activeTab, items]
  );

  useEffect(() => {
    if (conversations.length === 0) {
      setActiveConversation(null);
      setMobileConversation(null);
      return;
    }

    setActiveConversation((current) => {
      if (!current) {
        return conversations[0];
      }

      const refreshed = conversations.find(
        (conversation) => conversation.id === current.id
      );

      return refreshed ?? conversations[0];
    });

    setMobileConversation((current) => {
      if (!current) {
        return null;
      }

      return (
        conversations.find((conversation) => conversation.id === current.id) ??
        null
      );
    });
  }, [conversations]);

  const renderFilters = () => (
    <div className="shrink-0 border-b border-[#e6e7eb] px-6">
      <div className="flex gap-8 text-[17px] font-medium">
        <MessagesFilterTab
          label={t("all")}
          active={activeTab === "all"}
          onClick={() => setActiveTab("all")}
        />
        <MessagesFilterTab
          label={t("unread")}
          count={unreadCount}
          active={activeTab === "unread"}
          onClick={() => setActiveTab("unread")}
        />
      </div>
    </div>
  );

  const renderConversationList = ({
    selectedConversationId,
    onSelectConversation,
  }: {
    selectedConversationId?: string;
    onSelectConversation: (conversation: ConversationItem) => void;
  }) => (
    <div className="h-full overflow-y-auto">
      {emptyReason === "not_logged_in" ? (
        <div className="px-5 py-6">
          <AuthPromptCard
            message={t("loginRequired")}
            loginLabel={t("loginButton")}
            signUpLabel={t("signUpButton")}
            onLogin={() =>
              openAuthModal({
                defaultMode: "login",
                initialRole: "student",
              })
            }
            onSignUp={() =>
              openAuthModal({
                defaultMode: "signup",
                initialRole: "student",
              })
            }
          />
        </div>
      ) : loading ? (
        <div className="px-5 py-6 text-sm text-[#6b7280]">
          {tc("loading")}
        </div>
      ) : conversations.length === 0 ? (
        <div className="px-5 py-6 text-sm text-[#6b7280]">
          {activeTab === "unread"
            ? t("noUnreadMessages")
            : t("noConversations")}
        </div>
      ) : (
        conversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            selected={conversation.id === selectedConversationId}
            onClick={() => onSelectConversation(conversation)}
          />
        ))
      )}
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex h-full min-h-0 flex-col items-center justify-center px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eef2ff]">
        <MessageSquare className="h-8 w-8 text-[#2563eb]" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-[#1f1f2d]">
        {t("selectConversation")}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#606579]">
        {t("selectConversationDescription")}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <SettingsTopTabs role={role} activeTabId="messages" />

      <main className="flex h-[calc(100dvh-7.5rem)] min-h-0 flex-col overflow-hidden">
        <div className="hidden lg:block">{renderFilters()}</div>

        <div className="hidden min-h-0 flex-1 overflow-hidden lg:grid lg:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-hidden border-b border-[#e6e7eb] bg-white lg:border-b-0 lg:border-r">
            {renderConversationList({
              selectedConversationId: activeConversation?.id,
              onSelectConversation: setActiveConversation,
            })}
          </aside>

          <section className="min-h-0 min-w-0 overflow-hidden bg-white">
            {activeConversation && emptyReason !== "not_logged_in" ? (
              <ConversationDetail
                conversation={activeConversation}
                onBack={() => setActiveConversation(null)}
              />
            ) : (
              renderEmptyState()
            )}
          </section>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:hidden">
          {!mobileConversation || emptyReason === "not_logged_in"
            ? renderFilters()
            : null}

          <div className="min-h-0 flex-1 overflow-hidden">
            {mobileConversation && emptyReason !== "not_logged_in" ? (
              <section className="h-full min-h-0 overflow-hidden bg-white">
                <ConversationDetail
                  conversation={mobileConversation}
                  onBack={() => setMobileConversation(null)}
                />
              </section>
            ) : (
              <aside className="h-full overflow-hidden bg-white">
                {renderConversationList({
                  selectedConversationId: mobileConversation?.id,
                  onSelectConversation: setMobileConversation,
                })}
              </aside>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function MessagesFilterTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 pb-4 pt-6 transition ${
        active ? "text-[#2563eb]" : "text-[#6b7280] hover:text-[#2563eb]"
      }`}
    >
      <span>{label}</span>
      {typeof count === "number" && count > 0 && (
        <span
          className={`inline-flex min-w-[22px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
            active
              ? "bg-[#dbeafe] text-[#1d4ed8]"
              : "bg-[#f3f4f6] text-[#1f1f2d]"
          }`}
        >
          {count}
        </span>
      )}
      {active && (
        <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#2563eb]" />
      )}
    </button>
  );
}
