"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

type ConversationUnreadRow = {
  id: string;
  unread_by: string[] | null;
};

/**
 * conversation.unread_by(uuid[]) に 自分のuser.id が含まれる会話数を返す
 */
export const useUnreadCount = () => {
  const supabase = useSupabaseClient();
  const user = useUser();

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
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
      console.error("useUnreadCount fetch error", error);
      setCount(0);
    } else {
      const unreadCount = ((data ?? []) as ConversationUnreadRow[]).filter(
        (conversation) => conversation.unread_by?.includes(user.id)
      ).length;
      setCount(unreadCount);
    }

    setLoading(false);
  }, [supabase, user]);

  // 初回 & ログイン変化
  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // conversation更新に追従（未読付与・既読化・送信で last_message_at 更新など）
  useEffect(() => {
    if (!user) return;

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
  }, [supabase, user, fetchCount]);

  return { unreadCount: count, loading, refetchUnreadCount: fetchCount };
};
