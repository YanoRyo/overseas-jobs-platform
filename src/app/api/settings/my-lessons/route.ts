import { NextResponse } from "next/server";
import type { BookingChangeRequestSummary } from "@/features/bookings/types";
import {
  expirePendingBookings,
  getBookingChangeRequestsByBookingIds,
  isMissingBookingMeetingColumnsError,
  isMissingPaymentRefundColumnsError,
  warnForMissingBookingMeetingColumns,
  warnForMissingPaymentRefundColumns,
} from "@/lib/bookings/server";
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
  status:
    | "pending"
    | "cancellation_requested"
    | "confirmed"
    | "completed"
    | "expired"
    | "cancelled"
    | "cancelled_by_mentor";
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
  country_code: string | null;
  hourly_rate: number | null;
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
  status: "pending" | "refund_pending" | "succeeded" | "failed" | "refunded";
  refund_amount: number | null;
  refunded_at: string | null;
};

function normalizeName(firstName?: string | null, lastName?: string | null) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || "Unknown";
}

async function fetchBookingsForLessons(params: {
  adminDb: ReturnType<typeof createSupabaseServiceClient>;
  viewerRole: ViewerRole;
  userId: string;
  mentorId: string | null;
}) {
  let bookingsQuery = params.adminDb
    .from("bookings")
    .select(
      "id, user_id, mentor_id, start_time, end_time, status, meeting_provider, meeting_join_url, meeting_host_url"
    )
    .in("status", [
      "confirmed",
      "pending",
      "cancellation_requested",
      "completed",
      "expired",
      "cancelled",
      "cancelled_by_mentor",
    ]);

  if (params.viewerRole === "mentor") {
    bookingsQuery = bookingsQuery.eq("mentor_id", params.mentorId);
  } else {
    bookingsQuery = bookingsQuery.eq("user_id", params.userId);
  }

  const bookingsResult = await bookingsQuery;
  if (!isMissingBookingMeetingColumnsError(bookingsResult.error)) {
    return bookingsResult;
  }

  warnForMissingBookingMeetingColumns(bookingsResult.error);

  let fallbackQuery = params.adminDb
    .from("bookings")
    .select("id, user_id, mentor_id, start_time, end_time, status")
    .in("status", [
      "confirmed",
      "pending",
      "cancellation_requested",
      "completed",
      "expired",
      "cancelled",
      "cancelled_by_mentor",
    ]);

  if (params.viewerRole === "mentor") {
    fallbackQuery = fallbackQuery.eq("mentor_id", params.mentorId);
  } else {
    fallbackQuery = fallbackQuery.eq("user_id", params.userId);
  }

  const fallbackResult = await fallbackQuery;
  if (fallbackResult.error) {
    return fallbackResult;
  }

  return {
    data: (fallbackResult.data ?? []).map((booking) => ({
      ...booking,
      meeting_provider: null,
      meeting_join_url: null,
      meeting_host_url: null,
    })),
    error: null,
  };
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

  try {
    await expirePendingBookings(adminDb);
  } catch (error) {
    console.error("Failed to refresh booking lifecycle:", error);
    return NextResponse.json(
      { error: "Failed to refresh booking lifecycle" },
      { status: 500 }
    );
  }

  const { data: bookings, error: bookingsError } = await fetchBookingsForLessons({
    adminDb,
    viewerRole,
    userId: user.id,
    mentorId,
  });

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

  async function fetchPaymentsForLessons() {
    const paymentsResult = await adminDb
      .from("payments")
      .select("booking_id, amount, currency, status, refund_amount, refunded_at")
      .in("booking_id", bookingIds);

    if (!isMissingPaymentRefundColumnsError(paymentsResult.error)) {
      return paymentsResult;
    }

    warnForMissingPaymentRefundColumns(paymentsResult.error);

    const fallbackResult = await adminDb
      .from("payments")
      .select("booking_id, amount, currency, status")
      .in("booking_id", bookingIds);

    if (fallbackResult.error) {
      return fallbackResult;
    }

    return {
      data: (fallbackResult.data ?? []).map((payment) => ({
        ...payment,
        refund_amount: null,
        refunded_at: null,
      })),
      error: null,
    };
  }

  async function fetchChangeRequestsForLessons() {
    try {
      return await getBookingChangeRequestsByBookingIds(bookingIds, adminDb);
    } catch (error) {
      console.warn(
        "Change request metadata is unavailable for My Lessons; falling back to empty request state.",
        error
      );
      return new Map<string, BookingChangeRequestSummary[]>();
    }
  }

  const [mentorsResult, usersResult, paymentsResult, changeRequestsMap] =
    await Promise.all([
      adminDb
        .from("mentors")
        .select(
          "id, user_id, first_name, last_name, avatar_url, country_code, hourly_rate"
        )
        .in("id", mentorIds),
      adminDb
        .from("users")
        .select("id, first_name, last_name, avatar_url")
        .in("id", userIds),
      fetchPaymentsForLessons(),
      fetchChangeRequestsForLessons(),
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
    const relatedRequests = changeRequestsMap.get(String(booking.id)) ?? [];
    const changeRequest =
      relatedRequests.find((request) => request.status === "pending") ??
      relatedRequests[0] ??
      null;

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
      mentorId: booking.mentor_id,
      mentorCountry: mentor?.country_code ?? null,
      mentorHourlyRate: mentor?.hourly_rate ?? null,
      amount: payment?.amount ?? null,
      currency: payment?.currency ?? "usd",
      paymentStatus: payment?.status ?? null,
      refundAmount: payment?.refund_amount ?? null,
      refundedAt: payment?.refunded_at ?? null,
      meetingUrl:
        viewerRole === "mentor"
          ? booking.meeting_host_url ?? booking.meeting_join_url
          : booking.meeting_join_url,
      meetingProvider: booking.meeting_provider,
      changeRequest: changeRequest as BookingChangeRequestSummary | null,
    };
  });

  return NextResponse.json({ lessons });
}
