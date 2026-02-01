"use client";

import { useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import type { SendMessageInput } from "../types/sendMessageInput";

export const useSendMessage = () => {
  const supabase = useSupabaseClient();
  const user = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async ({
    mentorId,
    category,
    message,
  }: SendMessageInput): Promise<boolean> => {
    if (!user) {
      setError("ログインしてください");
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const userId = user.id;

      // ① 既存 conversation を探す
      const mentorUserId = mentorId; // mentor の auth.user.id を渡す前提
      const studentUserId = user.id;

      const { data: existingConversation, error: findError } = await supabase
        .from("conversation")
        .select("id")
        .eq("mentor_id", mentorUserId)
        .eq("student_id", studentUserId)
        .maybeSingle();

      if (findError) throw findError;

      let conversationId = existingConversation?.id;

      // ② なければ作る
      if (!conversationId) {
        const { data: newConversation, error: createError } = await supabase
          .from("conversation")
          .insert({
            mentor_id: mentorUserId,
            student_id: studentUserId,
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (createError) throw createError;
        conversationId = newConversation.id;
      }

      // ③ message に insert
      const { error: messageError } = await supabase.from("message").insert({
        conversation_id: conversationId,
        sender_id: userId,
        body: message,
        category,
      });

      if (messageError) throw messageError;

      // ④ conversation.last_message_at 更新
      const { error: updateError } = await supabase
        .from("conversation")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      if (updateError) throw updateError;

      return true;
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null) {
        const e = err as {
          message?: string;
          details?: string;
          hint?: string;
          code?: string;
        };
        console.error("Send error message:", e.message);
        console.error("Send error details:", e.details);
        console.error("Send error hint:", e.hint);
        console.error("Send error code:", e.code);
        console.error("Send raw:", err);
      } else {
        console.error("Send error (non-object):", err);
      }
      setError("送信に失敗しました");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendMessage,
    loading,
    error,
  };
};
