import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const mentorId = url.searchParams.get("mentorId");
  const weekStart = url.searchParams.get("weekStart");

  if (!mentorId || !weekStart) {
    return NextResponse.json(
      { error: "mentorId and weekStart are required" },
      { status: 400 }
    );
  }

  const weekStartDate = new Date(weekStart);
  if (isNaN(weekStartDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid weekStart format" },
      { status: 400 }
    );
  }

  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 7);

  const adminDb = createSupabaseServiceClient();

  const { data, error } = await adminDb
    .from("bookings")
    .select("start_time, end_time")
    .eq("mentor_id", mentorId)
    .in("status", ["pending", "confirmed"])
    .gte("start_time", weekStartDate.toISOString())
    .lt("start_time", weekEndDate.toISOString())
    .or(`status.eq.confirmed,expires_at.gt.${new Date().toISOString()}`);

  if (error) {
    console.error("booked-slots: query error", error);
    return NextResponse.json(
      { error: "Failed to fetch booked slots" },
      { status: 500 }
    );
  }

  // start_time/end_time のみ返却（meeting URL, user_id 等は含めない）
  const slots = (data ?? []).map((row) => ({
    startTime: row.start_time,
    endTime: row.end_time,
  }));

  return NextResponse.json({ slots });
}
