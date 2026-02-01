"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

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

    // unread_by が user.id を含む conversation の件数だけ欲しい
    const { count: c, error } = await supabase
      .from("conversation")
      .select("id", { count: "exact", head: true })
      .contains("unread_by", [user.id]); // ← uuid[] contains

    if (error) {
      console.error("useUnreadCount fetch error", error);
      setCount(0);
    } else {
      setCount(c ?? 0);
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
