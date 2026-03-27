"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { UserRole } from "../types";
import { useOAuthSignIn } from "./useOAuthSignIn";

type UseSignupOptions = {
  initialRole?: UserRole;
  redirect?: string;
};

export const useSignup = (options?: UseSignupOptions) => {
  const supabase = useSupabaseClient();
  const router = useRouter();
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
  const [rememberMe, setRememberMe] = useState(false);
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
      alert("Please select a role.");
      return;
    }

    if (!email || !password || password !== confirmPassword) {
      alert("Please check your inputs.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id,
        username: email.split("@")[0],
        role: selectedRole,
      });
    }

    setSuccessMessage(
      "We've sent a confirmation email. Please open the link in your inbox to finish creating your account."
    );
  };

  const handleSuccessClose = () => {
    setSuccessMessage(null);
    router.push("/auth/login");
  };

  return {
    email,
    password,
    confirmPassword,
    role,
    rememberMe,
    loading,
    successMessage,
    setEmail,
    setPassword,
    setConfirmPassword,
    setRole,
    setRememberMe,
    handleEmailSignup,
    handleSuccessClose,
    handleGoogleSignup: signInWithGoogle,
    handleFacebookSignup: signInWithFacebook,
  };
};
