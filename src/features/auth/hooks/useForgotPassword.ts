"use client";

import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

const RESET_REQUEST_MESSAGE =
  "If an account exists for this email, you'll receive a password reset link shortly.";

export const useForgotPassword = () => {
  const supabase = useSupabaseClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const normalizedEmail = email.trim();

    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      }
    );

    if (error) {
      console.error("resetPasswordForEmail error", error);
    }

    setMessage(RESET_REQUEST_MESSAGE);
    setLoading(false);
  };

  return {
    email,
    loading,
    message,
    setEmail,
    handleSubmit,
  };
};
