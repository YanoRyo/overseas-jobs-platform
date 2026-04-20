"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useSessionContext,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";

type ConversationUnreadRow = {
  id: string;
  unread_by: string[] | null;
};

function normalizeSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: String(error ?? "Unknown error") };
  }

  const record = error as Record<string, unknown>;

  return {
    code: typeof record.code === "string" ? record.code : null,
    message: typeof record.message === "string" ? record.message : null,
    details: typeof record.details === "string" ? record.details : null,
    hint: typeof record.hint === "string" ? record.hint : null,
    name: typeof record.name === "string" ? record.name : null,
    status:
      typeof record.status === "number" || typeof record.status === "string"
        ? record.status
        : null,
  };
}

/**
 * conversation.unread_by(uuid[]) に 自分のuser.id が含まれる会話数を返す
 */
export const useUnreadCount = () => {
  const supabase = useSupabaseClient();
  const { isLoading: authLoading, session } = useSessionContext();
  const user = session?.user ?? null;

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    // staging 環境では uuid[] contains が不安定なことがあるため、
    // 自分が参加している会話を取得してから未読件数を数える
    const { data, error } = await supabase
      .from("conversation")
      .select("id, unread_by")
      .or(`mentor_id.eq.${user.id},student_id.eq.${user.id}`);

    if (error) {
      console.error(
        "useUnreadCount fetch error",
        normalizeSupabaseError(error)
      );
      setCount(0);
    } else {
      const unreadCount = ((data ?? []) as ConversationUnreadRow[]).filter(
        (conversation) => conversation.unread_by?.includes(user.id)
      ).length;
      setCount(unreadCount);
    }

    setLoading(false);
  }, [authLoading, supabase, user]);

  // 初回 & ログイン変化
  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    void fetchCount();
  }, [authLoading, fetchCount]);

  // conversation更新に追従（未読付与・既読化・送信で last_message_at 更新など）
  useEffect(() => {
    if (authLoading || !user) return;

    const ch1 = supabase
      .channel(`unread-count-mentor:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation",
          filter: `mentor_id=eq.${user.id}`,
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    const ch2 = supabase
      .channel(`unread-count-student:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation",
          filter: `student_id=eq.${user.id}`,
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [authLoading, supabase, user, fetchCount]);

  return { unreadCount: count, loading, refetchUnreadCount: fetchCount };
};
