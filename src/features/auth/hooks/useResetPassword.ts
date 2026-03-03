"use client";

import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { toResetPasswordErrorMessage } from "../utils/authError";
import { usePasswordResetSession } from "./usePasswordResetSession";

export const useResetPassword = () => {
  const supabase = useSupabaseClient();
  const { checking, canReset } = usePasswordResetSession();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canReset) {
      setError("This reset link is invalid or expired.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(
        toResetPasswordErrorMessage(error) ??
          "An unexpected error occurred.",
      );
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setPassword("");
    setConfirmPassword("");
    setIsSuccess(true);
    setLoading(false);
  };

  return {
    password,
    confirmPassword,
    loading,
    checking,
    canReset,
    error,
    isSuccess,
    setPassword,
    setConfirmPassword,
    handleSubmit,
  };
};
