"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useOAuthSignIn } from "./useOAuthSignIn";
import type { UserRole } from "../types";
import {
  isEmailNotConfirmedError,
  shouldSuggestVerificationResend,
  toResendErrorMessage,
} from "../utils/authError";

type UseLoginOptions = {
  initialRole?: UserRole;
  redirect?: string;
};

export const useLogin = (options?: UseLoginOptions) => {
  const router = useRouter();
  const redirectPath = options?.redirect
    ? options.redirect.startsWith("/")
      ? options.redirect
      : "/"
    : "/";
  const supabase = useSupabaseClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const { role, setRole, signInWithGoogle, signInWithFacebook } =
    useOAuthSignIn({
      redirect: redirectPath,
      initialRole: options?.initialRole,
      requireRole: !options?.initialRole,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsEmailVerification(false);
    setResendMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      if (isEmailNotConfirmedError(error)) {
        setError("Please verify your email before logging in.");
        setNeedsEmailVerification(true);
        return;
      }

      if (shouldSuggestVerificationResend(error)) {
        setError(
          "Invalid login credentials. If you recently signed up, try resending the verification email."
        );
        setNeedsEmailVerification(true);
        return;
      }

      setError(error.message);
      return;
    }

    router.push(redirectPath);
  };

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage("Please enter your email address.");
      return;
    }

    setResendLoading(true);
    setResendMessage(null);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setResendMessage(toResendErrorMessage(error));
      setResendLoading(false);
      return;
    }

    setResendMessage(
      "If your account exists, a verification email has been sent."
    );
    setResendLoading(false);
  };

  return {
    email,
    password,
    loading,
    error,
    needsEmailVerification,
    resendLoading,
    resendMessage,
    role,
    setEmail,
    setPassword,
    setRole,
    handleSubmit,
    handleResendVerification,
    handleGoogleLogin: signInWithGoogle,
    handleFacebookLogin: signInWithFacebook,
  };
};
