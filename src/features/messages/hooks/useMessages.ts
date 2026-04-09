"use client";

import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import type { Message } from "../types/message";
import { sendMessageRequest } from "../lib/sendMessageRequest";

const createClientId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const useMessages = (conversationId: string | null) => {
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
        setError("Failed to load messages.");
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
      setError("Please log in.");
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

      const { message: sentMessage } = await sendMessageRequest({
        conversationId,
        category: category ?? null,
        message: body,
      });

      // pending → sent に置換
      setMessages((prev) =>
        prev.map((m) =>
          m.client_id === clientId
            ? { ...sentMessage, status: "sent" }
            : m
        )
      );

      return true;
    } catch (e) {
      console.error(e);

      setMessages((prev) =>
        prev.map((m) =>
          m.client_id === clientId ? { ...m, status: "failed" } : m
        )
      );

      setError("Failed to send the message.");
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
