"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

import { AuthPromptCard } from "@/components/AuthPromptCard";
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
  const searchParams = useSearchParams();

  const t = useTranslations("messages");
  const tc = useTranslations("common");
  const { items, loading, emptyReason } = useMessageThreads(tab);

  const redirectTarget = useMemo(() => {
    const query = searchParams.toString();
    if (!pathname) return "/";
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  const redirectParam = useMemo(
    () => encodeURIComponent(redirectTarget),
    [redirectTarget]
  );

  // 未ログイン時：ログイン/新規登録導線を表示
  if (emptyReason === "not_logged_in") {
    return (
      <div className="px-4 py-6">
        <AuthPromptCard
          message={t("loginRequired")}
          loginLabel={t("loginButton")}
          signUpLabel={t("signUpButton")}
          onLogin={() => router.push(`/auth/login?redirect=${redirectParam}`)}
          onSignUp={() => router.push(`/auth/signup?redirect=${redirectParam}`)}
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
