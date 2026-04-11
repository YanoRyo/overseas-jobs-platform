"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

const RESET_REQUEST_MESSAGE =
  "If an account exists for this email, you'll receive a password reset link shortly.";

export const useForgotPassword = () => {
  const supabase = useSupabaseClient();
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);

    const normalizedEmail = email.trim();

    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
      }
    );

    if (error) {
      console.error("resetPasswordForEmail error", error);
    }

    setSuccessMessage(RESET_REQUEST_MESSAGE);
    setLoading(false);
  };

  const handleSuccessClose = () => {
    setSuccessMessage(null);
  };

  return {
    email,
    loading,
    successMessage,
    setEmail,
    handleSubmit,
    handleSuccessClose,
  };
};
