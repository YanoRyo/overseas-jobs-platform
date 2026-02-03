"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const redirectFromParams = searchParams.get("redirect") || "/";
  const redirectPath = options?.redirect
    ? options.redirect.startsWith("/")
      ? options.redirect
      : "/"
    : redirectFromParams.startsWith("/")
      ? redirectFromParams
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

    alert("We've sent you a confirmation email.");
    const pendingReservation = localStorage.getItem("pendingReservation");
    if (pendingReservation) {
      router.push("/checkout");
    } else {
      router.push(redirectPath);
    }
  };

  return {
    email,
    password,
    confirmPassword,
    role,
    rememberMe,
    loading,
    setEmail,
    setPassword,
    setConfirmPassword,
    setRole,
    setRememberMe,
    handleEmailSignup,
    handleGoogleSignup: signInWithGoogle,
    handleFacebookSignup: signInWithFacebook,
  };
};
