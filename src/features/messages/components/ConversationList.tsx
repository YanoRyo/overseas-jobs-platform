"use client";

import { useTranslations } from "next-intl";
import { AuthPromptCard } from "@/components/AuthPromptCard";
import { useAuthModal } from "@/features/auth/context/AuthModalProvider";
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
  const t = useTranslations("messages");
  const tc = useTranslations("common");
  const { openAuthModal } = useAuthModal();
  const { items, loading, emptyReason } = useMessageThreads(tab);

  // 未ログイン時：ログイン/新規登録導線を表示
  if (emptyReason === "not_logged_in") {
    return (
      <div className="px-4 py-6">
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
    );
  }

  if (loading) {
    return <div className="px-4 py-6 text-sm text-gray-400">{tc("loading")}</div>;
  }

  const conversations = items.filter((c) => {
    if (tab === "all") return true;
    if (tab === "unread") return c.unread;
    return true;
  });

  if (conversations.length === 0) {
    return <div className="px-4 py-6 text-sm text-gray-400">{t("noMessages")}</div>;
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
