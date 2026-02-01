"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useOAuthSignIn } from "./useOAuthSignIn";

export const useLogin = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const redirectPath = redirect.startsWith("/") ? redirect : "/";
  const supabase = useSupabaseClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { role, setRole, signInWithGoogle, signInWithFacebook } =
    useOAuthSignIn({
      redirect: redirectPath,
      requireRole: true,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push(redirectPath);
  };

  return {
    email,
    password,
    loading,
    error,
    role,
    setEmail,
    setPassword,
    setRole,
    handleSubmit,
    handleGoogleLogin: signInWithGoogle,
    handleFacebookLogin: signInWithFacebook,
  };
};
