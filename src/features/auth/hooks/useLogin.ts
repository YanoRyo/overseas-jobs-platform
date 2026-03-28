"use client";
import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useOAuthSignIn } from "./useOAuthSignIn";
import type { UserRole } from "../types";
import {
  isEmailNotConfirmedError,
  shouldSuggestVerificationResend,
  toResendErrorMessage,
} from "../utils/authError";
import { syncUserProfile } from "../utils/syncUserProfile";

type UseLoginOptions = {
  initialRole?: UserRole;
  redirect?: string;
};

export const useLogin = (options?: UseLoginOptions) => {
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

  const getNetworkErrorMessage = () =>
    "Could not reach the authentication server. Please check your connection and try again.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsEmailVerification(false);
    setResendMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
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

      const syncResult = await syncUserProfile(
        role,
        data.session?.access_token ?? null
      );
      if (!syncResult.ok) {
        setError(
          syncResult.error ??
            "Failed to prepare your user profile. Please try again."
        );
        return;
      }

      if (!data.session) {
        setError("Login session could not be established. Please try again.");
        return;
      }

      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      window.location.assign(redirectPath);
    } catch (caughtError) {
      console.error("signInWithPassword error", caughtError);
      setLoading(false);
      setError(getNetworkErrorMessage());
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage("Please enter your email address.");
      return;
    }

    setResendLoading(true);
    setResendMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?${new URLSearchParams(
            {
              redirect: redirectPath,
              ...(role ? { role } : {}),
            }
          ).toString()}`,
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
    } catch (caughtError) {
      console.error("resend verification error", caughtError);
      setResendMessage(getNetworkErrorMessage());
      setResendLoading(false);
    }
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
