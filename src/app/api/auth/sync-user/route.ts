import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

type UserRole = "student" | "mentor";

const isUserRole = (value: unknown): value is UserRole =>
  value === "student" || value === "mentor";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  const userResult = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();
  const {
    data: { user },
    error: userError,
  } = userResult;

  if (userError) {
    console.error("sync-user auth error", userError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let requestedRole: UserRole | null = null;

  try {
    const body = (await request.json()) as { role?: unknown };
    requestedRole = isUserRole(body.role) ? body.role : null;
  } catch {
    requestedRole = null;
  }

  const metadataRole = isUserRole(user.user_metadata?.role)
    ? user.user_metadata.role
    : null;

  const adminDb = createSupabaseServiceClient();
  const { data: existingUser, error: existingUserError } = await adminDb
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (existingUserError) {
    console.error("sync-user existing user fetch error", existingUserError);
    return NextResponse.json(
      { error: "Failed to read user profile" },
      { status: 500 }
    );
  }

  const payload: {
    id: string;
    username: string;
    role?: UserRole;
  } = {
    id: user.id,
    username: user.email?.split("@")[0] ?? "no-name",
  };

  // 既存ユーザー: DB上のroleを固定（nullでもbody/metadataからの変更を許可しない）
  // 新規ユーザー: metadataRole優先、OAuth用にrequestedRoleをフォールバック
  const roleToPersist = existingUser
    ? existingUser.role
    : (metadataRole ?? requestedRole ?? null);

  if (roleToPersist) {
    payload.role = roleToPersist;
  }

  const { error: upsertError } = await adminDb.from("users").upsert(payload);

  if (upsertError) {
    console.error("sync-user upsert error", upsertError);
    return NextResponse.json(
      { error: "Failed to sync user profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
