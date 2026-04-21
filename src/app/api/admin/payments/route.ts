import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { expirePendingBookings } from "@/lib/bookings/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminDb = createSupabaseServiceClient();
  try {
    await expirePendingBookings(adminDb);
  } catch (error) {
    console.error("Admin payments lifecycle refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh booking lifecycle" },
      { status: 500 }
    );
  }

  // 決済一覧を取得（bookings + payments + mentors）
  const { data: payments, error } = await adminDb
    .from("payments")
    .select(
      `
      id,
      amount,
      currency,
      status,
      paid_at,
      created_at,
      booking_id,
      user_id,
      mentor_id
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin payments fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }

  if (payments.length === 0) {
    return NextResponse.json({ payments: [] });
  }

  // 関連するbookingとmentor情報を取得
  const bookingIds = [...new Set(payments.map((p) => p.booking_id))];
  const mentorIds = [...new Set(payments.map((p) => p.mentor_id))];

  const [bookingsResult, mentorsResult] = await Promise.all([
    adminDb
      .from("bookings")
      .select("id, status, start_time, end_time")
      .in("id", bookingIds),
    adminDb
      .from("mentors")
      .select("id, first_name, last_name")
      .in("id", mentorIds),
  ]);

  const bookingsMap = new Map(
    (bookingsResult.data ?? []).map((b) => [b.id, b])
  );
  const mentorsMap = new Map(
    (mentorsResult.data ?? []).map((m) => [m.id, m])
  );

  const enrichedPayments = payments.map((p) => {
    const booking = bookingsMap.get(p.booking_id);
    const mentor = mentorsMap.get(p.mentor_id);
    return {
      ...p,
      booking: booking ?? null,
      mentorName: mentor
        ? `${mentor.first_name} ${mentor.last_name}`
        : "Unknown",
    };
  });

  return NextResponse.json({ payments: enrichedPayments });
}
