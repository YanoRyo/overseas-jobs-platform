"use client";

import { useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { toChangePasswordErrorMessage } from "@/features/auth/utils/authError";

export function validateChangePasswordForm(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): string | null {
  if (
    !currentPassword.trim() ||
    !newPassword.trim() ||
    !confirmPassword.trim()
  ) {
    return "Please fill in all fields.";
  }

  if (newPassword !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}

export function useChangePassword() {
  const supabase = useSupabaseClient();
  const user = useUser();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = validateChangePasswordForm(
      currentPassword,
      newPassword,
      confirmPassword,
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user?.email) {
      setError("Could not verify user. Please try again.");
      return;
    }

    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      setError("Current password is incorrect.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(toChangePasswordErrorMessage(updateError));
      setLoading(false);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccess(true);
    setLoading(false);
  };

  return {
    currentPassword,
    newPassword,
    confirmPassword,
    loading,
    error,
    success,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    handleSubmit,
  };
}
