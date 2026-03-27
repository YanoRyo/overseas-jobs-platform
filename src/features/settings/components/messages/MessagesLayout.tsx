"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { ConversationDetail } from "@/features/messages/components/ConversationDetail";
import { ConversationItem as ConversationListItem } from "@/features/messages/components/ConversationItem";
import { useMessageThreads } from "@/features/messages/hooks/useMessageThreads";
import { useUnreadCount } from "@/features/messages/hooks/useUnreadCount";
import type { MessageTab } from "@/features/messages/types/messageTab";
import type { ConversationItem } from "@/features/messages/types/conversationItem";

import { SettingsTopTabs } from "../SettingsTopTabs";

type Props = {
  role: "student" | "mentor";
};

export function MessagesLayout({ role }: Props) {
  const [activeTab, setActiveTab] = useState<MessageTab>("all");
  const [activeConversation, setActiveConversation] =
    useState<ConversationItem | null>(null);
  const { unreadCount } = useUnreadCount();
  const { items, loading, emptyReason } = useMessageThreads(activeTab);
  const router = useRouter();
  const pathname = usePathname();

  const redirectParam = useMemo(
    () => encodeURIComponent(pathname || "/settings?tab=messages"),
    [pathname]
  );

  const tabs = useMemo(
    () => [
      { id: "home", label: "Home", href: "/", clickable: true, roles: [role] },
      {
        id: "messages",
        label: "Messages",
        href: "/settings?tab=messages",
        clickable: true,
        roles: [role],
      },
      {
        id: "my-lessons",
        label: "My lessons",
        href: "/settings?tab=my-lessons",
        clickable: true,
        roles: [role],
      },
      {
        id: "settings",
        label: "Settings",
        href: "/settings",
        clickable: true,
        roles: [role],
      },
    ],
    [role]
  );

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
  }, [conversations]);

  return (
    <div className="min-h-screen bg-white">
      <SettingsTopTabs role={role} activeTabId="messages" tabs={tabs} />

      <main className="min-h-[calc(100vh-57px)]">
        <div className="border-b border-[#e6e7eb] px-6">
          <div className="flex gap-8 text-[17px] font-medium">
            <MessagesFilterTab
              label="All"
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
            />
            <MessagesFilterTab
              label="Unread"
              count={unreadCount}
              active={activeTab === "unread"}
              onClick={() => setActiveTab("unread")}
            />
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-114px)] grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="border-r border-[#e6e7eb] bg-white">
            <div className="h-full overflow-y-auto">
              {emptyReason === "not_logged_in" ? (
                <div className="px-5 py-6">
                  <div className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-4 text-sm text-[#92400e]">
                    Please sign up or log in to view your messages.
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/auth/login?redirect=${redirectParam}`)
                        }
                        className="rounded-full bg-[#111827] px-4 py-2 text-xs font-semibold text-white"
                      >
                        Log In
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/auth/signup?redirect=${redirectParam}`)
                        }
                        className="rounded-full border border-[#111827] px-4 py-2 text-xs font-semibold text-[#111827]"
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>
                </div>
              ) : loading ? (
                <div className="px-5 py-6 text-sm text-[#6b7280]">
                  Loading messages...
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-5 py-6 text-sm text-[#6b7280]">
                  {activeTab === "unread"
                    ? "You have no unread messages."
                    : "No conversations yet."}
                </div>
              ) : (
                conversations.map((conversation) => (
                  <ConversationListItem
                    key={conversation.id}
                    conversation={conversation}
                    selected={conversation.id === activeConversation?.id}
                    onClick={() => setActiveConversation(conversation)}
                  />
                ))
              )}
            </div>
          </aside>

          <section className="min-w-0 bg-white">
            {activeConversation && emptyReason !== "not_logged_in" ? (
              <ConversationDetail
                conversation={activeConversation}
                onBack={() => setActiveConversation(null)}
              />
            ) : (
              <div className="flex h-full min-h-[calc(100vh-114px)] flex-col items-center justify-center px-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eef2ff]">
                  <MessageSquare className="h-8 w-8 text-[#2563eb]" />
                </div>
                <h1 className="mt-6 text-2xl font-semibold text-[#1f1f2d]">
                  Select a conversation
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#606579]">
                  Open a message thread from the list to read the latest
                  conversation and reply from here.
                </p>
              </div>
            )}
          </section>
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
        active ? "text-[#1f1f2d]" : "text-[#6b7280] hover:text-[#1f1f2d]"
      }`}
    >
      <span>{label}</span>
      {typeof count === "number" && count > 0 && (
        <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-[#f3f4f6] px-2 py-0.5 text-xs font-semibold text-[#1f1f2d]">
          {count}
        </span>
      )}
      {active && (
        <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#2563eb]" />
      )}
    </button>
  );
}
