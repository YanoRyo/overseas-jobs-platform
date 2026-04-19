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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("booking create auth error", userError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    mentorId?: unknown;
    startTime?: unknown;
    endTime?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const mentorId =
    typeof body.mentorId === "string" && body.mentorId.trim().length > 0
      ? body.mentorId
      : null;
  const startTime =
    typeof body.startTime === "string" && body.startTime.trim().length > 0
      ? body.startTime
      : null;
  const endTime =
    typeof body.endTime === "string" && body.endTime.trim().length > 0
      ? body.endTime
      : null;

  if (!mentorId || !startTime || !endTime) {
    return NextResponse.json(
      { error: "mentorId, startTime, and endTime are required" },
      { status: 400 }
    );
  }

  const parsedStart = new Date(startTime);
  const parsedEnd = new Date(endTime);

  if (
    Number.isNaN(parsedStart.getTime()) ||
    Number.isNaN(parsedEnd.getTime()) ||
    parsedEnd <= parsedStart
  ) {
    return NextResponse.json(
      { error: "The booking time is invalid" },
      { status: 400 }
    );
  }

  const adminDb = createSupabaseServiceClient();
  const { data: existingUser, error: existingUserError } = await adminDb
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (existingUserError) {
    console.error("booking create existing user fetch error", existingUserError);
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

  const metadataRole = isUserRole(user.user_metadata?.role)
    ? user.user_metadata.role
    : null;

  if (existingUser?.role ?? metadataRole) {
    payload.role = (existingUser?.role ?? metadataRole) as UserRole;
  }

  const { error: upsertError } = await adminDb.from("users").upsert(payload);

  if (upsertError) {
    console.error("booking create user sync error", upsertError);
    return NextResponse.json(
      { error: "Failed to sync user profile" },
      { status: 500 }
    );
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const { data: booking, error: bookingError } = await adminDb
    .from("bookings")
    .insert({
      user_id: user.id,
      mentor_id: mentorId,
      start_time: parsedStart.toISOString(),
      end_time: parsedEnd.toISOString(),
      status: "pending",
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    console.error("booking create insert error", bookingError);
    return NextResponse.json(
      {
        error:
          bookingError?.message ??
          "Failed to create the booking. Please try again.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ bookingId: booking.id });
}
