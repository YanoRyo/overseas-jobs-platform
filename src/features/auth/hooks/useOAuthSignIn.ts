"use client";

import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { UserRole } from "../types";

type UseOAuthSignInOptions = {
  redirect: string;
  initialRole?: UserRole | null;
  requireRole?: boolean;
};

const isUserRole = (value: UserRole | null): value is UserRole =>
  value === "student" || value === "mentor";

export const useOAuthSignIn = (options: UseOAuthSignInOptions) => {
  const supabase = useSupabaseClient();
  const [role, setRole] = useState<UserRole | null>(
    options.initialRole ?? null
  );
  const requireRole = options.requireRole ?? false;

  const ensureRole = () => {
    if (requireRole && !role) {
      alert("Please select a role.");
      return null;
    }
    return role;
  };

  const buildRedirectTo = (selectedRole: UserRole | null) => {
    const params = new URLSearchParams({ redirect: options.redirect });
    if (isUserRole(selectedRole)) {
      params.set("role", selectedRole);
    }
    return `${window.location.origin}/auth/callback?${params.toString()}`;
  };

  const signInWithProvider = async (provider: "google" | "facebook") => {
    const selectedRole = ensureRole();
    if (requireRole && !selectedRole) return;

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: buildRedirectTo(selectedRole),
      },
    });
  };

  return {
    role,
    setRole,
    signInWithGoogle: () => signInWithProvider("google"),
    signInWithFacebook: () => signInWithProvider("facebook"),
  };
};
