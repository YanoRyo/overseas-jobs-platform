"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { UserRole } from "../types";
import { useOAuthSignIn } from "./useOAuthSignIn";
import { syncUserProfile } from "../utils/syncUserProfile";

type UseSignupOptions = {
  initialRole?: UserRole;
  redirect?: string;
  onSuccessClose?: () => void;
};

export const useSignup = (options?: UseSignupOptions) => {
  const supabase = useSupabaseClient();
  const locale = useLocale();
  const router = useRouter();
  const te = useTranslations("auth.errors");
  const ta = useTranslations("auth");
  const redirectPath = options?.redirect
    ? options.redirect.startsWith("/")
      ? options.redirect
      : "/"
    : "/";
  const initialRole =
    options?.initialRole === "student" || options?.initialRole === "mentor"
      ? options.initialRole
      : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { role, setRole, signInWithGoogle, signInWithFacebook } =
    useOAuthSignIn({
      redirect: redirectPath,
      initialRole,
      requireRole: true,
    });

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedRole = role;
    if (!selectedRole) {
      alert(ta("selectRole"));
      return;
    }

    if (!email || !password || password !== confirmPassword) {
      alert(te("checkInputs"));
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?${new URLSearchParams(
          {
            redirect: redirectPath,
            role: selectedRole,
          }
        ).toString()}`,
        data: {
          role: selectedRole,
          username: email.split("@")[0],
        },
      },
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data.session) {
      const syncResult = await syncUserProfile(
        selectedRole,
        data.session.access_token
      );

      if (!syncResult.ok) {
        alert(syncResult.error ?? te("profileFailed"));
        return;
      }
    }

    setSuccessMessage(te("confirmationSent"));
  };

  const handleSuccessClose = () => {
    setSuccessMessage(null);
    if (options?.onSuccessClose) {
      options.onSuccessClose();
      return;
    }

    router.push("/auth/login");
  };

  return {
    email,
    password,
    confirmPassword,
    role,
    loading,
    successMessage,
    setEmail,
    setPassword,
    setConfirmPassword,
    setRole,
    handleEmailSignup,
    handleSuccessClose,
    handleGoogleSignup: signInWithGoogle,
    handleFacebookSignup: signInWithFacebook,
  };
};
