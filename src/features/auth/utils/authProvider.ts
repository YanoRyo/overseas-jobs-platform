import type { User } from "@supabase/supabase-js";

export function isEmailProvider(user: User | null): boolean {
  if (!user) return false;
  return user.identities?.some((i) => i.provider === "email") ?? false;
}
