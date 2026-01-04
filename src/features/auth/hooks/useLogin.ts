"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export const useLogin = () => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    router.push("/");
  };

  return {
    email,
    password,
    loading,
    error,
    setEmail,
    setPassword,
    handleSubmit,
  };
};
