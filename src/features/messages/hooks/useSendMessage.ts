"use client";

import { useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import type { SendMessageInput } from "../types";

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
      const { data: existingConversation, error: findError } = await supabase
        .from("conversation")
        .select("*")
        .or(
          `and(mentor_id.eq.${mentorId},student_id.eq.${userId}),and(mentor_id.eq.${userId},student_id.eq.${mentorId})`
        )
        .maybeSingle();

      if (findError) throw findError;

      let conversationId = existingConversation?.id;

      // ② なければ作る
      if (!conversationId) {
        const { data: newConversation, error: createError } = await supabase
          .from("conversation")
          .insert({
            mentor_id: mentorId,
            student_id: userId,
            last_message_at: new Date().toISOString(),
          })
          .select()
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
      console.error("Send error:", err);
      console.log("stringify:", JSON.stringify(err, null, 2));
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
