"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "@/i18n/navigation";
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
  const locale = useLocale();
  const router = useRouter();
  const te = useTranslations("auth.errors");

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

  const getNetworkErrorMessage = () => te("networkError");

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
          setError(te("emailNotConfirmed"));
          setNeedsEmailVerification(true);
          return;
        }

        if (shouldSuggestVerificationResend(error)) {
          setError(te("invalidCredentials"));
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
        setError(syncResult.error ?? te("syncFailed"));
        return;
      }

      if (!data.session) {
        setError(te("sessionFailed"));
        return;
      }

      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      router.push(redirectPath);
    } catch (caughtError) {
      console.error("signInWithPassword error", caughtError);
      setLoading(false);
      setError(getNetworkErrorMessage());
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage(te("enterEmail"));
      return;
    }

    setResendLoading(true);
    setResendMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?${new URLSearchParams(
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

      setResendMessage(te("verificationSent"));
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
