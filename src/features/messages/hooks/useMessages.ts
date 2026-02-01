"use client";

import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import type { Message } from "../types/message";

const createClientId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const useMessages = (
  conversationId: string | null,
  receiverId?: string | null // ★追加：相手user_id
) => {
  const supabase = useSupabaseClient();
  const user = useUser();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUse = useMemo(
    () => !!user && !!conversationId,
    [user, conversationId]
  );

  // ① 初回ロード
  useEffect(() => {
    if (!canUse) return;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("message")
        .select("id, conversation_id, sender_id, body, category, created_at")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        setError("メッセージの取得に失敗しました");
        setMessages([]);
      } else {
        setMessages((data ?? []) as Message[]);
      }

      setLoading(false);
    };

    fetch();
  }, [canUse, supabase, conversationId]);

  // ② Realtime（INSERT）
  useEffect(() => {
    if (!canUse) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            const pendingIndex = prev.findIndex(
              (m) =>
                m.status === "pending" &&
                m.sender_id === newMsg.sender_id &&
                m.body === newMsg.body
            );

            if (pendingIndex !== -1) {
              const next = [...prev];
              next[pendingIndex] = { ...newMsg, status: "sent" };
              return next;
            }

            return [...prev, { ...newMsg, status: "sent" }];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canUse, supabase, conversationId]);

  // ③ 送信（楽観的UI）
  const send = async (body: string, category?: string) => {
    if (!user) {
      setError("ログインしてください");
      return false;
    }
    if (!conversationId) return false;
    if (!body.trim()) return false;

    const clientId = createClientId();
    const nowIso = new Date().toISOString();

    const optimistic: Message = {
      id: -1,
      client_id: clientId,
      status: "pending",
      conversation_id: conversationId,
      sender_id: user.id,
      body,
      category: category ?? null,
      created_at: nowIso,
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      setSending(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from("message")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body,
          category: category ?? null,
        })
        .select("id, conversation_id, sender_id, body, category, created_at")
        .single();

      if (insertError) throw insertError;

      // pending → sent に置換
      setMessages((prev) =>
        prev.map((m) =>
          m.client_id === clientId
            ? { ...(data as Message), status: "sent" }
            : m
        )
      );

      if (receiverId) {
        const { error: unreadError } = await supabase.rpc(
          "mark_conversation_as_unread",
          {
            p_conversation_id: conversationId,
            p_receiver_id: receiverId,
          }
        );
        if (unreadError) console.error("mark unread error", unreadError);
      } else {
        // receiverIdが無い時も last_message_at だけ更新（保険）
        const { error: updateError } = await supabase
          .from("conversation")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversationId);

        if (updateError)
          console.error("last_message_at update error", updateError);
      }

      return true;
    } catch (e) {
      console.error(e);

      setMessages((prev) =>
        prev.map((m) =>
          m.client_id === clientId ? { ...m, status: "failed" } : m
        )
      );

      setError("送信に失敗しました");
      return false;
    } finally {
      setSending(false);
    }
  };

  const retry = async (clientId: string) => {
    const target = messages.find((m) => m.client_id === clientId);
    if (!target) return false;
    setMessages((prev) => prev.filter((m) => m.client_id !== clientId));
    return send(target.body, target.category ?? undefined);
  };

  return {
    messages,
    loading,
    sending,
    error,
    send,
    retry,
    currentUserId: user?.id ?? null,
  };
};
