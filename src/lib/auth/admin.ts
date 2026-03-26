import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("isAdmin check failed:", error);
    return false;
  }
  return data !== null;
}
