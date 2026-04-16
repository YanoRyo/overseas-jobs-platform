"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useUser } from "@supabase/auth-helpers-react";
import type { SendMessageInput } from "../types/sendMessageInput";
import { sendMessageRequest } from "../lib/sendMessageRequest";

export const useSendMessage = () => {
  const user = useUser();
  const t = useTranslations("messages");
  const ts = useTranslations("messages.sendModal");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async ({
    mentorId,
    category,
    message,
  }: SendMessageInput): Promise<boolean> => {
    if (!user) {
      setError(ts("loginRequired"));
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      await sendMessageRequest({
        mentorId,
        category,
        message,
      });

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
      setError(t("sendFailed"));
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
