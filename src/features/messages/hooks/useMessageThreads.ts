"use client";

import { useEffect, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

import type { MessageTab } from "../types/messageTab";
import type { ConversationItem } from "../types/conversationItem";
import type { ConversationRow } from "../types/conversationRow";
import { mapConversationRowToListItem } from "../mapper/mapConversationRowToListItem";

type LastMessage = {
  conversation_id: string;
  body: string;
  created_at: string;
};
type EmptyReason = "not_logged_in" | "no_conversations" | null;

export const useMessageThreads = (tab: MessageTab) => {
  const supabase = useSupabaseClient();
  const user = useUser();

  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [emptyReason, setEmptyReason] = useState<EmptyReason>(null);

  useEffect(() => {
    const fetchThreads = async () => {
      if (!user) {
        setItems([]);
        setEmptyReason("not_logged_in");
        setLoading(false);
        return;
      }
      setLoading(true);
      setEmptyReason(null);

      /**
       * ① conversation を取得（message joinしない）
       */
      const { data: convs, error: convError } = await supabase
        .from("conversation")
        .select("id, mentor_id, student_id, last_message_at, unread_by")
        .or(`mentor_id.eq.${user.id},student_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (convError || !convs) {
        console.error("fetchThreads convError", convError);
        setItems([]);
        setEmptyReason("no_conversations");
        setLoading(false);
        return;
      }

      if (convs.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      /**
       * ② conversationId を集めて message をまとめて取得（最新順）
       */
      const convIds = convs.map((c) => c.id);

      const { data: msgs, error: msgError } = await supabase
        .from("message")
        .select("conversation_id, body, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false });

      if (msgError) {
        console.error("fetchThreads msgError", msgError);
        // message が取れなくても conversation は出せるように続行
      }

      /**
       * ③ conversation_id → 最新message を Map 化
       */
      const lastMsgMap = new Map<
        string,
        { body: string; created_at: string }
      >();
      for (const m of (msgs ?? []) as LastMessage[]) {
        if (!lastMsgMap.has(m.conversation_id)) {
          lastMsgMap.set(m.conversation_id, {
            body: m.body,
            created_at: m.created_at,
          });
        }
      }

      /**
       * ④ mapper に渡す row を組み立てて map
       * ConversationRow の message は `message:message(...)` で取ると配列になる設計だったので
       * それに合わせて「配列(0 or 1)」を作って渡す
       */
      const rows: ConversationRow[] = convs.map((c) => {
        const last = lastMsgMap.get(c.id);
        return {
          ...c,
          message: last
            ? [{ body: last.body, created_at: last.created_at }]
            : [],
        } as ConversationRow;
      });

      const mapped: ConversationItem[] = rows.map((row) =>
        mapConversationRowToListItem(row, user.id)
      );

      /**
       * ⑤ partnerId（= 相手の auth user id）を集める
       */
      const partnerIds = [...new Set(mapped.map((i) => i.partnerId))].filter(
        Boolean
      );

      if (partnerIds.length === 0) {
        setItems(mapped);
        setLoading(false);
        return;
      }

      /**
       * ⑥ mentors を「user_id」で取得
       */
      const { data: mentors, error: mentorError } = await supabase
        .from("mentors")
        .select("user_id, first_name, last_name, avatar_url")
        .in("user_id", partnerIds);

      const { data: users } = await supabase
        .from("users")
        .select("id, username")
        .in("id", partnerIds);

      const userMap = new Map(users?.map((u) => [u.id, u]) ?? []);

      if (mentorError) console.error("mentors fetch error", mentorError);

      const mentorMap = new Map(mentors?.map((m) => [m.user_id, m]) ?? []);

      /**
       * ⑦ 合成して完成
       */
      setItems(
        mapped.map((item) => {
          const mentor = mentorMap.get(item.partnerId);
          const user = userMap.get(item.partnerId);

          return {
            ...item,
            partnerName: mentor
              ? `${mentor.first_name} ${mentor.last_name}`
              : user?.username ?? "Unknown",
            partnerAvatarUrl: mentor?.avatar_url,
          };
        })
      );

      setLoading(false);
    };

    fetchThreads();
  }, [user, tab, supabase]);

  return { items, loading, emptyReason };
};
