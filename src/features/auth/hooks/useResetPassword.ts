"use client";

import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export const useResetPassword = () => {
  const supabase = useSupabaseClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setCanReset(!!session);
      setChecking(false);
    };

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY") {
        setCanReset(true);
        setChecking(false);
        return;
      }

      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setCanReset(!!session);
        setChecking(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

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
      if (error.code === "same_password") {
        setError("Please choose a different password.");
      } else if (error.code === "weak_password") {
        setError("Please choose a stronger password.");
      } else {
        setError("Could not update password. Please request a new reset link.");
      }
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setPassword("");
    setConfirmPassword("");
    setCanReset(false);
    setMessage("Password updated. Please log in with your new password.");
    setLoading(false);
  };

  return {
    password,
    confirmPassword,
    loading,
    checking,
    canReset,
    error,
    message,
    setPassword,
    setConfirmPassword,
    handleSubmit,
  };
};
