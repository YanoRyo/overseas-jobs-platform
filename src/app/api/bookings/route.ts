import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

const BOOKING_EXPIRY_MINUTES = 15;
const ALLOWED_DURATIONS = [25, 50] as const;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { mentorId?: unknown; startTime?: unknown; duration?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const mentorId =
    typeof body.mentorId === "string" ? body.mentorId.trim() : null;
  const startTimeStr =
    typeof body.startTime === "string" ? body.startTime.trim() : null;
  const duration =
    typeof body.duration === "number" &&
    ALLOWED_DURATIONS.includes(body.duration as (typeof ALLOWED_DURATIONS)[number])
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
      { error: `Invalid duration. Allowed values: ${ALLOWED_DURATIONS.join(", ")} minutes` },
      { status: 400 }
    );
  }

  const startTime = new Date(startTimeStr);
  if (isNaN(startTime.getTime())) {
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

  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + duration);

  const adminDb = createSupabaseServiceClient();

  // メンターの存在確認（mentorIdはmentors.idを指す）
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
    return NextResponse.json(
      { error: "Mentor not found" },
      { status: 404 }
    );
  }

  // 重複予約チェック（pending期限内 or confirmed の予約と時間が重複していないか）
  const { data: overlapping, error: overlapError } = await adminDb
    .from("bookings")
    .select("id")
    .eq("mentor_id", mentor.id)
    .in("status", ["pending", "confirmed"])
    .lt("start_time", endTime.toISOString())
    .gt("end_time", startTime.toISOString())
    .or(`status.eq.confirmed,expires_at.gt.${new Date().toISOString()}`)
    .limit(1);

  if (overlapError) {
    console.error("bookings: overlap check error", overlapError);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }

  if (overlapping && overlapping.length > 0) {
    return NextResponse.json(
      { error: "This time slot is already booked" },
      { status: 409 }
    );
  }

  // サーバー側でexpires_atとstatusを固定
  const expiresAt = new Date(
    Date.now() + BOOKING_EXPIRY_MINUTES * 60 * 1000
  ).toISOString();

  const { data: booking, error: insertError } = await adminDb
    .from("bookings")
    .insert({
      user_id: user.id,
      mentor_id: mentor.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: "pending",
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("bookings: insert error", insertError);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }

  return NextResponse.json({ bookingId: booking.id });
}
