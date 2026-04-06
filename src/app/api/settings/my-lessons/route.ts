import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

type ViewerRole = "student" | "mentor";

type BookingRow = {
  id: string;
  user_id: string;
  mentor_id: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "completed";
  meeting_provider: string | null;
  meeting_join_url: string | null;
  meeting_host_url: string | null;
};

type MentorRow = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
};

type UserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type PaymentRow = {
  booking_id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
};

function normalizeName(firstName?: string | null, lastName?: string | null) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || "Unknown";
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const adminDb = createSupabaseServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const requestedRole = url.searchParams.get("role");

  const { data: mentorProfile, error: mentorProfileError } = await adminDb
    .from("mentors")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (mentorProfileError) {
    console.error("Failed to resolve mentor profile:", mentorProfileError);
    return NextResponse.json(
      { error: "Failed to resolve lessons" },
      { status: 500 }
    );
  }

  const viewerRole: ViewerRole =
    requestedRole === "mentor" && mentorProfile ? "mentor" : "student";
  const mentorId = mentorProfile?.id ?? null;

  if (viewerRole === "mentor" && !mentorId) {
    return NextResponse.json({ lessons: [] });
  }

  let bookingsQuery = adminDb
    .from("bookings")
    .select(
      "id, user_id, mentor_id, start_time, end_time, status, meeting_provider, meeting_join_url, meeting_host_url"
    )
    .in("status", ["confirmed", "pending", "completed"]);

  if (viewerRole === "mentor") {
    bookingsQuery = bookingsQuery.eq("mentor_id", mentorId);
  } else {
    bookingsQuery = bookingsQuery.eq("user_id", user.id);
  }

  const { data: bookings, error: bookingsError } = await bookingsQuery;

  if (bookingsError) {
    console.error("Failed to fetch bookings for My Lessons:", bookingsError);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ lessons: [] });
  }

  const bookingRows = bookings as BookingRow[];
  const bookingIds = bookingRows.map((booking) => booking.id);
  const mentorIds = [...new Set(bookingRows.map((booking) => booking.mentor_id))];
  const userIds = [...new Set(bookingRows.map((booking) => booking.user_id))];

  const [mentorsResult, usersResult, paymentsResult] = await Promise.all([
    adminDb
      .from("mentors")
      .select("id, user_id, first_name, last_name, avatar_url")
      .in("id", mentorIds),
    adminDb
      .from("users")
      .select("id, first_name, last_name, avatar_url")
      .in("id", userIds),
    adminDb
      .from("payments")
      .select("booking_id, amount, currency, status")
      .in("booking_id", bookingIds),
  ]);

  if (mentorsResult.error) {
    console.error("Failed to fetch mentors for My Lessons:", mentorsResult.error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }

  if (usersResult.error) {
    console.error("Failed to fetch users for My Lessons:", usersResult.error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }

  if (paymentsResult.error) {
    console.error("Failed to fetch payments for My Lessons:", paymentsResult.error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }

  const mentorMap = new Map<string, MentorRow>();
  for (const mentor of (mentorsResult.data ?? []) as MentorRow[]) {
    mentorMap.set(mentor.id, mentor);
  }

  const userMap = new Map<string, UserRow>();
  for (const row of (usersResult.data ?? []) as UserRow[]) {
    userMap.set(row.id, row);
  }

  const paymentMap = new Map<string, PaymentRow>();
  for (const payment of (paymentsResult.data ?? []) as PaymentRow[]) {
    paymentMap.set(payment.booking_id, payment);
  }

  const lessons = bookingRows.map((booking) => {
    const mentor = mentorMap.get(booking.mentor_id);
    const student = userMap.get(booking.user_id);
    const payment = paymentMap.get(booking.id);

    return {
      id: booking.id,
      startTime: booking.start_time,
      endTime: booking.end_time,
      status: booking.status,
      participantName:
        viewerRole === "mentor"
          ? normalizeName(student?.first_name, student?.last_name)
          : normalizeName(mentor?.first_name, mentor?.last_name),
      participantAvatarUrl:
        viewerRole === "mentor"
          ? (student?.avatar_url ?? null)
          : (mentor?.avatar_url ?? null),
      participantLabel: viewerRole === "mentor" ? "Student" : "Mentor",
      amount: payment?.amount ?? null,
      currency: payment?.currency ?? "usd",
      paymentStatus: payment?.status ?? null,
      meetingUrl:
        viewerRole === "mentor"
          ? booking.meeting_host_url ?? booking.meeting_join_url
          : booking.meeting_join_url,
      meetingProvider: booking.meeting_provider,
    };
  });

  return NextResponse.json({ lessons });
}
