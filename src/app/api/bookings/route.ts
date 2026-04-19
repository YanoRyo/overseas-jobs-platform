import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

type UserRole = "student" | "mentor";

const BOOKING_EXPIRY_MINUTES = 15;
const ALLOWED_DURATIONS = [25, 50] as const;

const isUserRole = (value: unknown): value is UserRole =>
  value === "student" || value === "mentor";

type AtomicBookingResult = {
  booking_id: number | null;
  conflict: boolean;
};

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

  let body: { mentorId?: unknown; startTime?: unknown; duration?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const mentorId =
    typeof body.mentorId === "string" ? body.mentorId.trim() : null;
  const startTimeStr =
    typeof body.startTime === "string" ? body.startTime.trim() : null;
  const duration =
    typeof body.duration === "number" &&
    ALLOWED_DURATIONS.includes(
      body.duration as (typeof ALLOWED_DURATIONS)[number]
    )
      ? (body.duration as (typeof ALLOWED_DURATIONS)[number])
      : null;

  if (!mentorId || !startTimeStr) {
    return NextResponse.json(
      { error: "mentorId and startTime are required" },
      { status: 400 }
    );
  }

  if (!duration) {
    return NextResponse.json(
      {
        error: `Invalid duration. Allowed values: ${ALLOWED_DURATIONS.join(", ")} minutes`,
      },
      { status: 400 }
    );
  }

  const startTime = new Date(startTimeStr);
  if (Number.isNaN(startTime.getTime())) {
    return NextResponse.json(
      { error: "Invalid startTime format" },
      { status: 400 }
    );
  }

  if (startTime.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "Cannot book a slot in the past" },
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
  const roleToPersist = existingUser?.role ?? metadataRole ?? null;

  if (roleToPersist) {
    payload.role = roleToPersist;
  }

  const { error: upsertError } = await adminDb.from("users").upsert(payload);

  if (upsertError) {
    console.error("booking create user sync error", upsertError);
    return NextResponse.json(
      { error: "Failed to sync user profile" },
      { status: 500 }
    );
  }

  const { data: mentor, error: mentorError } = await adminDb
    .from("mentors")
    .select("id")
    .eq("id", mentorId)
    .maybeSingle();

  if (mentorError) {
    console.error("bookings: mentor lookup error", mentorError);
    return NextResponse.json(
      { error: "Failed to verify mentor" },
      { status: 500 }
    );
  }

  if (!mentor) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  const { data: result, error: rpcError } = await adminDb.rpc(
    "create_booking_atomic",
    {
      p_user_id: user.id,
      p_mentor_id: mentor.id,
      p_start_time: startTime.toISOString(),
      p_duration_minutes: duration,
      p_expiry_minutes: BOOKING_EXPIRY_MINUTES,
    }
  );

  if (rpcError) {
    console.error("bookings: atomic create error", rpcError);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }

  const bookingResult = (result ?? null) as AtomicBookingResult | null;
  if (!bookingResult || bookingResult.conflict || !bookingResult.booking_id) {
    return NextResponse.json(
      { error: "This time slot is already booked" },
      { status: 409 }
    );
  }

  return NextResponse.json({ bookingId: bookingResult.booking_id });
}
