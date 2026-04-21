import { NextResponse } from "next/server";
import {
  expirePendingBookings,
  isMissingBookingChangeRequestsTableError,
  isMissingBookingMeetingColumnsError,
  isMissingPaymentRefundColumnsError,
  warnForMissingBookingMeetingColumns,
  warnForMissingBookingChangeRequestsTable,
  warnForMissingPaymentRefundColumns,
} from "@/lib/bookings/server";
import {
  getMeetingSetupIssuesByBookingIds,
  type MeetingSetupIssueRecord,
} from "@/lib/meetings/issues";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import type {
  AdminCaseFlag,
  AdminBookingChangeRequest,
  AdminMentorCase,
  AdminOperationsResponse,
  AdminReservationCase,
  AdminUserCase,
} from "@/features/admin/types";

type BookingRow = {
  id: number;
  mentor_id: string | null;
  user_id: string | null;
  start_time: string | null;
  end_time: string | null;
  status:
    | "pending"
    | "cancellation_requested"
    | "confirmed"
    | "completed"
    | "expired"
    | "cancelled"
    | "cancelled_by_mentor"
    | null;
  created_at: string | null;
  expires_at: string | null;
  meeting_provider: string | null;
  meeting_join_url: string | null;
  meeting_host_url: string | null;
};

type UserRow = {
  id: string;
  username: string | null;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone_country_code: string | null;
  phone_number: string | null;
  timezone: string | null;
  created_at: string | null;
};

type MentorRow = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  avatar_url: string | null;
  country_code: string | null;
  phone_country_code: string | null;
  phone_number: string | null;
  timezone: string | null;
  hourly_rate: number | null;
  stripe_account_id: string | null;
  stripe_onboarding_completed: boolean | null;
  created_at: string | null;
};

type PaymentRow = {
  id: string;
  booking_id: number;
  user_id: string;
  mentor_id: string;
  amount: number;
  currency: string;
  status: "pending" | "refund_pending" | "succeeded" | "failed" | "refunded";
  paid_at: string | null;
  refund_amount: number | null;
  refunded_at: string | null;
  refund_reason: string | null;
  created_at: string | null;
  student_confirmation_email_sent_at: string | null;
  mentor_booking_email_sent_at: string | null;
};

type PayoutRow = {
  id: string;
  payment_id: string;
  mentor_id: string;
  amount: number;
  status: string;
  created_at: string | null;
};

type ChangeRequestRow = {
  id: string;
  booking_id: number;
  requester_user_id: string;
  type: "cancel";
  status: "pending" | "approved" | "rejected";
  reason: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

function getTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value).getTime();
  }
  return new Date(`${value}Z`).getTime();
}

function buildDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string | null
) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || fallback || "Unknown";
}

function buildPhoneNumber(
  phoneCountryCode?: string | null,
  phoneNumber?: string | null
) {
  const value = [phoneCountryCode, phoneNumber]
    .filter(Boolean)
    .join(" ")
    .trim();
  return value || null;
}

function getLatestPayoutByPaymentId(payouts: PayoutRow[]) {
  const latestPayoutMap = new Map<string, PayoutRow>();

  for (const payout of payouts) {
    const current = latestPayoutMap.get(payout.payment_id);
    if (!current || getTimestamp(payout.created_at) > getTimestamp(current.created_at)) {
      latestPayoutMap.set(payout.payment_id, payout);
    }
  }

  return latestPayoutMap;
}

function getLatestReservationTime(reservations: AdminReservationCase[]) {
  if (reservations.length === 0) return null;

  return [...reservations].sort(
    (left, right) => getTimestamp(right.startTime) - getTimestamp(left.startTime)
  )[0]?.startTime ?? null;
}

function hasPendingChangeRequest(changeRequests: AdminBookingChangeRequest[]) {
  return changeRequests.some((request) => request.status === "pending");
}

function isLessonCompletionEligible(
  booking: BookingRow,
  payment: PaymentRow | null,
  payout: PayoutRow | null,
  changeRequests: AdminBookingChangeRequest[]
) {
  const lessonEndAt = getTimestamp(booking.end_time);

  return (
    payment?.status === "succeeded" &&
    booking.status === "confirmed" &&
    lessonEndAt > 0 &&
    lessonEndAt <= Date.now() &&
    !hasPendingChangeRequest(changeRequests) &&
    (!payout || payout.status === "failed")
  );
}

function isPayoutApprovalEligible(
  booking: BookingRow,
  payment: PaymentRow | null,
  payout: PayoutRow | null
) {
  return (
    payment?.status === "succeeded" &&
    booking.status === "completed" &&
    (!payout || payout.status === "failed")
  );
}

function buildReservationFlags(
  booking: BookingRow,
  mentor: MentorRow | null,
  payment: PaymentRow | null,
  payout: PayoutRow | null,
  changeRequests: AdminBookingChangeRequest[],
  meetingSetupIssue: MeetingSetupIssueRecord | null
) {
  const now = Date.now();
  const flags: AdminCaseFlag[] = [];

  if (payment?.status === "failed") {
    flags.push({
      type: "payment_failed",
      label: "Payment failed",
      tone: "danger",
    });
  }

  if (payment?.status === "refunded") {
    flags.push({
      type: "payment_refunded",
      label: "Refunded payment",
      tone: "danger",
    });
  }

  if (payment?.status === "refund_pending") {
    flags.push({
      type: "refund_pending",
      label: "Refund pending",
      tone: "warning",
    });
  }

  if (
    booking.status === "expired" ||
    (booking.status === "pending" &&
      booking.expires_at &&
      getTimestamp(booking.expires_at) < now)
  ) {
    flags.push({
      type: "expired_pending_booking",
      label:
        booking.status === "expired"
          ? "Expired booking"
          : "Expired pending booking",
      tone: "warning",
    });
  }

  if (changeRequests.some((request) => request.status === "pending")) {
    flags.push({
      type: "change_request_pending",
      label: "Cancellation request pending",
      tone: "warning",
    });
  }

  if (booking.status === "cancelled_by_mentor") {
    flags.push({
      type: "mentor_cancelled",
      label: "Mentor cancelled lesson",
      tone: "danger",
    });
  }

  if (isLessonCompletionEligible(booking, payment, payout, changeRequests)) {
    flags.push({
      type: "lesson_completion_due",
      label: "Lesson completion due",
      tone: "warning",
    });
  }

  if (isPayoutApprovalEligible(booking, payment, payout)) {
    flags.push({
      type: "awaiting_payout_approval",
      label:
        payout?.status === "failed"
          ? "Retry payout approval"
          : "Awaiting payout approval",
      tone: "warning",
    });
  }

  if (meetingSetupIssue?.status === "unresolved") {
    flags.push({
      type: "meeting_setup_issue",
      label: "Meeting setup issue",
      tone: "danger",
    });
  } else if (
    booking.status === "confirmed" &&
    !booking.meeting_join_url &&
    !booking.meeting_host_url
  ) {
    flags.push({
      type: "meeting_link_missing",
      label: "Meeting link missing",
      tone: "warning",
    });
  }

  if (
    mentor &&
    !mentor.stripe_onboarding_completed &&
    booking.status !== "completed"
  ) {
    flags.push({
      type: "mentor_payout_setup_incomplete",
      label: "Mentor payout setup incomplete",
      tone: "info",
    });
  }

  if (payout?.status === "failed") {
    flags.push({
      type: "payout_failed",
      label: "Latest payout failed",
      tone: "danger",
    });
  }

  return flags;
}

function buildUserStateLabel(params: {
  failedPayments: number;
  refundedPayments: number;
  expiredReservations: number;
  cancelledReservations: number;
  confirmedReservations: number;
  pendingReservations: number;
  completedReservations: number;
}) {
  if (params.failedPayments > 0) return "Payment issue";
  if (params.refundedPayments > 0) return "Refund follow-up";
  if (params.expiredReservations > 0) return "Expired booking";
  if (params.confirmedReservations > 0) return "Upcoming lesson";
  if (params.pendingReservations > 0) return "Pending checkout";
  if (params.cancelledReservations > 0) return "Cancelled booking";
  if (params.completedReservations > 0) return "Lesson history";
  return "No reservations yet";
}

function buildMentorStateLabel(params: {
  stripeOnboardingCompleted: boolean;
  failedPayouts: number;
  awaitingPayoutApproval: number;
  expiredReservations: number;
  cancelledReservations: number;
  confirmedReservations: number;
  completedReservations: number;
}) {
  if (!params.stripeOnboardingCompleted) return "Payout blocked";
  if (params.failedPayouts > 0) return "Payout issue";
  if (params.awaitingPayoutApproval > 0) return "Awaiting payout approval";
  if (params.expiredReservations > 0) return "Expired bookings";
  if (params.confirmedReservations > 0) return "Upcoming lessons";
  if (params.cancelledReservations > 0) return "Cancelled lessons";
  if (params.completedReservations > 0) return "Active mentor";
  return "No lessons yet";
}

function sortRecentReservationIds(reservations: AdminReservationCase[]) {
  return [...reservations]
    .sort((left, right) => getTimestamp(right.startTime) - getTimestamp(left.startTime))
    .slice(0, 5)
    .map((reservation) => reservation.bookingId);
}

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
    console.error("Admin operations lifecycle refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh booking lifecycle" },
      { status: 500 }
    );
  }

  async function fetchPaymentsForAdminOperations() {
    const paymentsResult = await adminDb
      .from("payments")
      .select(
        "id, booking_id, user_id, mentor_id, amount, currency, status, paid_at, refund_amount, refunded_at, refund_reason, created_at, student_confirmation_email_sent_at, mentor_booking_email_sent_at"
      )
      .order("created_at", { ascending: false });

    if (!isMissingPaymentRefundColumnsError(paymentsResult.error)) {
      return paymentsResult;
    }

    warnForMissingPaymentRefundColumns(paymentsResult.error);

    const fallbackResult = await adminDb
      .from("payments")
      .select(
        "id, booking_id, user_id, mentor_id, amount, currency, status, paid_at, created_at, student_confirmation_email_sent_at, mentor_booking_email_sent_at"
      )
      .order("created_at", { ascending: false });

    if (fallbackResult.error) {
      return fallbackResult;
    }

    return {
      data: (fallbackResult.data ?? []).map((payment) => ({
        ...payment,
        refund_amount: null,
        refunded_at: null,
        refund_reason: null,
      })),
      error: null,
    };
  }

  async function fetchChangeRequestsForAdminOperations() {
    const changeRequestsResult = await adminDb
      .from("booking_change_requests")
      .select(
        "id, booking_id, requester_user_id, type, status, reason, review_note, reviewed_at, created_at"
      )
      .eq("type", "cancel")
      .order("created_at", { ascending: false });

    if (!isMissingBookingChangeRequestsTableError(changeRequestsResult.error)) {
      return changeRequestsResult;
    }

    warnForMissingBookingChangeRequestsTable(changeRequestsResult.error);

    return {
      data: [],
      error: null,
    };
  }

  async function fetchBookingsForAdminOperations() {
    const bookingsResult = await adminDb
      .from("bookings")
      .select(
        "id, mentor_id, user_id, start_time, end_time, status, created_at, expires_at, meeting_provider, meeting_join_url, meeting_host_url"
      )
      .order("start_time", { ascending: false });

    if (!isMissingBookingMeetingColumnsError(bookingsResult.error)) {
      return bookingsResult;
    }

    warnForMissingBookingMeetingColumns(bookingsResult.error);

    const fallbackResult = await adminDb
      .from("bookings")
      .select("id, mentor_id, user_id, start_time, end_time, status, created_at, expires_at")
      .order("start_time", { ascending: false });

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

  const [
    bookingsResult,
    usersResult,
    mentorsResult,
    paymentsResult,
    payoutsResult,
    changeRequestsResult,
  ] = await Promise.all([
      fetchBookingsForAdminOperations(),
      adminDb
        .from("users")
        .select(
          "id, username, role, first_name, last_name, avatar_url, phone_country_code, phone_number, timezone, created_at"
        )
        .order("created_at", { ascending: false }),
      adminDb
        .from("mentors")
        .select(
          "id, user_id, first_name, last_name, email, avatar_url, country_code, phone_country_code, phone_number, timezone, hourly_rate, stripe_account_id, stripe_onboarding_completed, created_at"
        )
        .order("created_at", { ascending: false }),
      fetchPaymentsForAdminOperations(),
      adminDb
        .from("payouts")
        .select("id, payment_id, mentor_id, amount, status, created_at")
        .order("created_at", { ascending: false }),
      fetchChangeRequestsForAdminOperations(),
    ]);

  if (bookingsResult.error) {
    console.error("Admin operations bookings fetch error:", bookingsResult.error);
    return NextResponse.json(
      { error: "Failed to fetch admin reservations" },
      { status: 500 }
    );
  }

  if (usersResult.error) {
    console.error("Admin operations users fetch error:", usersResult.error);
    return NextResponse.json(
      { error: "Failed to fetch admin users" },
      { status: 500 }
    );
  }

  if (mentorsResult.error) {
    console.error("Admin operations mentors fetch error:", mentorsResult.error);
    return NextResponse.json(
      { error: "Failed to fetch admin mentors" },
      { status: 500 }
    );
  }

  if (paymentsResult.error) {
    console.error("Admin operations payments fetch error:", paymentsResult.error);
    return NextResponse.json(
      { error: "Failed to fetch admin payments" },
      { status: 500 }
    );
  }

  if (payoutsResult.error) {
    console.error("Admin operations payouts fetch error:", payoutsResult.error);
    return NextResponse.json(
      { error: "Failed to fetch admin payouts" },
      { status: 500 }
    );
  }

  if (changeRequestsResult.error) {
    console.error(
      "Admin operations change requests fetch error:",
      changeRequestsResult.error
    );
    return NextResponse.json(
      { error: "Failed to fetch admin change requests" },
      { status: 500 }
    );
  }

  const bookings = (bookingsResult.data ?? []) as BookingRow[];
  const users = (usersResult.data ?? []) as UserRow[];
  const mentors = (mentorsResult.data ?? []) as MentorRow[];
  const payments = (paymentsResult.data ?? []) as PaymentRow[];
  const payouts = (payoutsResult.data ?? []) as PayoutRow[];
  const changeRequests = (changeRequestsResult.data ?? []) as ChangeRequestRow[];
  const meetingSetupIssuesByBookingId = await getMeetingSetupIssuesByBookingIds(
    bookings.map((booking) => booking.id),
    adminDb
  );

  const userMap = new Map(users.map((row) => [row.id, row]));
  const mentorMap = new Map(mentors.map((row) => [row.id, row]));
  const mentorByUserIdMap = new Map(mentors.map((row) => [row.user_id, row]));
  const paymentByBookingIdMap = new Map(payments.map((row) => [row.booking_id, row]));
  const latestPayoutByPaymentIdMap = getLatestPayoutByPaymentId(payouts);
  const changeRequestsByBookingId = new Map<number, AdminBookingChangeRequest[]>();

  for (const request of changeRequests) {
    const requester = userMap.get(request.requester_user_id);
    const mappedRequest: AdminBookingChangeRequest = {
      id: request.id,
      requesterUserId: request.requester_user_id,
      requesterDisplayName: buildDisplayName(
        requester?.first_name,
        requester?.last_name,
        requester?.username
      ),
      requesterRole: requester?.role ?? null,
      type: request.type,
      status: request.status,
      reason: request.reason,
      reviewNote: request.review_note,
      reviewedAt: request.reviewed_at,
      createdAt: request.created_at,
    };

    const current = changeRequestsByBookingId.get(request.booking_id) ?? [];
    current.push(mappedRequest);
    changeRequestsByBookingId.set(request.booking_id, current);
  }

  const reservations: AdminReservationCase[] = bookings
    .map((booking) => {
      const student = booking.user_id ? userMap.get(booking.user_id) ?? null : null;
      const mentor =
        booking.mentor_id && mentorMap.has(booking.mentor_id)
          ? mentorMap.get(booking.mentor_id) ?? null
          : null;
      const payment = paymentByBookingIdMap.get(booking.id) ?? null;
      const payout = payment
        ? latestPayoutByPaymentIdMap.get(payment.id) ?? null
        : null;
      const bookingChangeRequests = changeRequestsByBookingId.get(booking.id) ?? [];
      const meetingSetupIssue =
        meetingSetupIssuesByBookingId.get(String(booking.id)) ?? null;
      const flags = buildReservationFlags(
        booking,
        mentor,
        payment,
        payout,
        bookingChangeRequests,
        meetingSetupIssue
      );

      return {
        id: String(booking.id),
        bookingId: booking.id,
        status: booking.status,
        startTime: booking.start_time,
        endTime: booking.end_time,
        createdAt: booking.created_at,
        expiresAt: booking.expires_at,
        meetingProvider: booking.meeting_provider,
        meetingJoinUrl: booking.meeting_join_url,
        meetingHostUrl: booking.meeting_host_url,
        meetingSetupIssue: meetingSetupIssue
          ? {
              id: meetingSetupIssue.id,
              provider: meetingSetupIssue.provider,
              errorSummary: meetingSetupIssue.errorSummary,
              occurredAt: meetingSetupIssue.occurredAt,
              status: meetingSetupIssue.status,
              failureCount: meetingSetupIssue.failureCount,
            }
          : null,
        hasMeetingLink: Boolean(
          booking.meeting_join_url || booking.meeting_host_url
        ),
        lessonCompletionEligible: isLessonCompletionEligible(
          booking,
          payment,
          payout,
          bookingChangeRequests
        ),
        paymentApprovalEligible: isPayoutApprovalEligible(
          booking,
          payment,
          payout
        ),
        needsAttention: flags.length > 0,
        student: {
          id: student?.id ?? booking.user_id ?? null,
          displayName: buildDisplayName(
            student?.first_name,
            student?.last_name,
            student?.username
          ),
          username: student?.username ?? null,
          role: student?.role ?? null,
          avatarUrl: student?.avatar_url ?? null,
          timezone: student?.timezone ?? null,
          phone: buildPhoneNumber(
            student?.phone_country_code,
            student?.phone_number
          ),
        },
        mentor: mentor
          ? {
              id: mentor.id,
              userId: mentor.user_id,
              displayName: buildDisplayName(
                mentor.first_name,
                mentor.last_name,
                mentor.email
              ),
              email: mentor.email,
              avatarUrl: mentor.avatar_url,
              timezone: mentor.timezone,
              hourlyRate: mentor.hourly_rate,
              stripeOnboardingCompleted: Boolean(
                mentor.stripe_onboarding_completed
              ),
            }
          : null,
        payment: payment
          ? {
              id: payment.id,
              status: payment.status,
              amount: payment.amount,
              currency: payment.currency,
              paidAt: payment.paid_at,
              createdAt: payment.created_at,
              refundAmount: payment.refund_amount,
              refundedAt: payment.refunded_at,
              refundReason: payment.refund_reason,
              studentConfirmationEmailSentAt:
                payment.student_confirmation_email_sent_at,
              mentorBookingEmailSentAt: payment.mentor_booking_email_sent_at,
            }
          : null,
        payout: payout
          ? {
              id: payout.id,
              status: payout.status,
              amount: payout.amount,
              createdAt: payout.created_at,
            }
          : null,
        changeRequests: bookingChangeRequests,
        flags,
      };
    })
    .sort((left, right) => {
      if (left.needsAttention !== right.needsAttention) {
        return left.needsAttention ? -1 : 1;
      }
      return getTimestamp(right.startTime) - getTimestamp(left.startTime);
    });

  const reservationsByUserId = new Map<string, AdminReservationCase[]>();
  const reservationsByMentorId = new Map<string, AdminReservationCase[]>();

  for (const reservation of reservations) {
    if (reservation.student.id) {
      const current = reservationsByUserId.get(reservation.student.id) ?? [];
      current.push(reservation);
      reservationsByUserId.set(reservation.student.id, current);
    }

    if (reservation.mentor?.id) {
      const current = reservationsByMentorId.get(reservation.mentor.id) ?? [];
      current.push(reservation);
      reservationsByMentorId.set(reservation.mentor.id, current);
    }
  }

  const usersData: AdminUserCase[] = users
    .map((userRow) => {
      const relatedReservations = reservationsByUserId.get(userRow.id) ?? [];
      const mentorProfile = mentorByUserIdMap.get(userRow.id) ?? null;
      const pendingReservations = relatedReservations.filter(
        (item) => item.status === "pending"
      ).length;
      const expiredReservations = relatedReservations.filter(
        (item) => item.status === "expired"
      ).length;
      const confirmedReservations = relatedReservations.filter(
        (item) => item.status === "confirmed"
      ).length;
      const completedReservations = relatedReservations.filter(
        (item) => item.status === "completed"
      ).length;
      const cancelledReservations = relatedReservations.filter(
        (item) =>
          item.status === "cancelled" || item.status === "cancelled_by_mentor"
      ).length;
      const failedPayments = relatedReservations.filter(
        (item) => item.payment?.status === "failed"
      ).length;
      const refundedPayments = relatedReservations.filter(
        (item) => item.payment?.status === "refunded"
      ).length;
      const attentionCases = relatedReservations.filter(
        (item) => item.needsAttention
      ).length;

      return {
        id: userRow.id,
        displayName: buildDisplayName(
          userRow.first_name,
          userRow.last_name,
          userRow.username
        ),
        username: userRow.username,
        role: userRow.role,
        avatarUrl: userRow.avatar_url,
        timezone: userRow.timezone,
        phone: buildPhoneNumber(
          userRow.phone_country_code,
          userRow.phone_number
        ),
        createdAt: userRow.created_at,
        hasMentorProfile: Boolean(mentorProfile),
        mentorProfileId: mentorProfile?.id ?? null,
        stateLabel: buildUserStateLabel({
          failedPayments,
          refundedPayments,
          expiredReservations,
          cancelledReservations,
          confirmedReservations,
          pendingReservations,
          completedReservations,
        }),
        needsAttention: attentionCases > 0 || failedPayments > 0 || refundedPayments > 0,
        counts: {
          totalReservations: relatedReservations.length,
          pendingReservations,
          expiredReservations,
          confirmedReservations,
          completedReservations,
          cancelledReservations,
          failedPayments,
          refundedPayments,
          attentionCases,
        },
        lastReservationAt: getLatestReservationTime(relatedReservations),
        recentReservationIds: sortRecentReservationIds(relatedReservations),
      };
    })
    .sort((left, right) => {
      if (left.needsAttention !== right.needsAttention) {
        return left.needsAttention ? -1 : 1;
      }
      return (
        getTimestamp(right.lastReservationAt) - getTimestamp(left.lastReservationAt)
      );
    });

  const mentorsData: AdminMentorCase[] = mentors
    .map((mentorRow) => {
      const relatedReservations = reservationsByMentorId.get(mentorRow.id) ?? [];
      const pendingReservations = relatedReservations.filter(
        (item) => item.status === "pending"
      ).length;
      const expiredReservations = relatedReservations.filter(
        (item) => item.status === "expired"
      ).length;
      const confirmedReservations = relatedReservations.filter(
        (item) => item.status === "confirmed"
      ).length;
      const completedReservations = relatedReservations.filter(
        (item) => item.status === "completed"
      ).length;
      const cancelledReservations = relatedReservations.filter(
        (item) =>
          item.status === "cancelled" || item.status === "cancelled_by_mentor"
      ).length;
      const awaitingPayoutApproval = relatedReservations.filter(
        (item) => item.paymentApprovalEligible
      ).length;
      const paidPayouts = relatedReservations.filter(
        (item) => item.payout?.status === "paid"
      ).length;
      const failedPayouts = relatedReservations.filter(
        (item) => item.payout?.status === "failed"
      ).length;

      return {
        id: mentorRow.id,
        userId: mentorRow.user_id,
        displayName: buildDisplayName(
          mentorRow.first_name,
          mentorRow.last_name,
          mentorRow.email
        ),
        email: mentorRow.email,
        avatarUrl: mentorRow.avatar_url,
        timezone: mentorRow.timezone,
        countryCode: mentorRow.country_code,
        phone: buildPhoneNumber(
          mentorRow.phone_country_code,
          mentorRow.phone_number
        ),
        hourlyRate: mentorRow.hourly_rate,
        stripeOnboardingCompleted: Boolean(
          mentorRow.stripe_onboarding_completed
        ),
        stripeAccountId: mentorRow.stripe_account_id,
        createdAt: mentorRow.created_at,
        stateLabel: buildMentorStateLabel({
          stripeOnboardingCompleted: Boolean(
            mentorRow.stripe_onboarding_completed
          ),
          failedPayouts,
          awaitingPayoutApproval,
          expiredReservations,
          cancelledReservations,
          confirmedReservations,
          completedReservations,
        }),
        needsAttention:
          !mentorRow.stripe_onboarding_completed ||
          awaitingPayoutApproval > 0 ||
          failedPayouts > 0,
        counts: {
          totalReservations: relatedReservations.length,
          pendingReservations,
          expiredReservations,
          confirmedReservations,
          completedReservations,
          cancelledReservations,
          awaitingPayoutApproval,
          paidPayouts,
          failedPayouts,
        },
        lastReservationAt: getLatestReservationTime(relatedReservations),
        recentReservationIds: sortRecentReservationIds(relatedReservations),
      };
    })
    .sort((left, right) => {
      if (left.needsAttention !== right.needsAttention) {
        return left.needsAttention ? -1 : 1;
      }
      return (
        getTimestamp(right.lastReservationAt) - getTimestamp(left.lastReservationAt)
      );
    });

  const response: AdminOperationsResponse = {
    updatedAt: new Date().toISOString(),
    summary: {
      totalReservations: reservations.length,
      reservationsNeedingAttention: reservations.filter((item) => item.needsAttention)
        .length,
      awaitingPayoutApproval: reservations.filter(
        (item) => item.paymentApprovalEligible
      ).length,
      meetingSetupIssues: reservations.filter((item) => item.meetingSetupIssue).length,
      expiredReservations: reservations.filter((item) => item.status === "expired")
        .length,
      usersNeedingAttention: usersData.filter((item) => item.needsAttention).length,
      mentorsNeedingAttention: mentorsData.filter((item) => item.needsAttention)
        .length,
      paymentFailures: reservations.filter(
        (item) => item.payment?.status === "failed"
      ).length,
    },
    reservations,
    users: usersData,
    mentors: mentorsData,
  };

  return NextResponse.json(response);
}
