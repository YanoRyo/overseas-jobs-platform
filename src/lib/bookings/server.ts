import "server-only";

import Stripe from "stripe";
import type {
  BookingChangeRequestStatus,
  BookingChangeRequestSummary,
  BookingChangeRequestType,
  BookingStatus,
  PaymentStatus,
} from "@/features/bookings/types";
import {
  sendCancellationApprovedEmails,
  sendMentorCancellationEmails,
  sendStudentCancellationRequestSubmittedEmails,
  type CancellationRefundState,
} from "@/lib/email/cancellationNotifications";
import { resolveMeetingSetupIssue } from "@/lib/meetings/issues";
import { stripe } from "@/lib/stripe/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>;

type BookingRow = {
  id: number;
  mentor_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus | null;
  expires_at: string | null;
  meeting_join_url: string | null;
  meeting_host_url: string | null;
};

type MentorOwnerRow = {
  id: string;
  user_id: string;
};

type PaymentRow = {
  id: string;
  booking_id: number;
  stripe_payment_intent_id: string;
  amount: number;
  status: PaymentStatus;
  refund_amount: number | null;
};

type ChangeRequestRow = {
  id: string;
  booking_id: number;
  requester_user_id: string;
  type: BookingChangeRequestType;
  status: BookingChangeRequestStatus;
  reason: string | null;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type PostgrestLikeError = {
  code?: string | null;
  message?: string | null;
};

const PAYMENT_REFUND_TRACKING_COLUMNS = [
  "stripe_refund_id",
  "refund_amount",
  "refund_reason",
  "refunded_at",
] as const;

const BOOKING_MEETING_COLUMNS = [
  "meeting_provider",
  "meeting_join_url",
  "meeting_host_url",
] as const;

let hasWarnedForMissingBookingChangeRequestsTable = false;
let hasWarnedForMissingPaymentRefundColumns = false;
let hasWarnedForMissingBookingMeetingColumns = false;

export class BookingActionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "BookingActionError";
    this.statusCode = statusCode;
  }
}

export function isMissingBookingChangeRequestsTableError(
  error?: PostgrestLikeError | null
) {
  if (error?.code !== "42P01") {
    return false;
  }

  const message = error.message ?? "";
  return message.includes("booking_change_requests");
}

export function warnForMissingBookingChangeRequestsTable(
  error?: PostgrestLikeError | null
) {
  if (hasWarnedForMissingBookingChangeRequestsTable) {
    return;
  }

  hasWarnedForMissingBookingChangeRequestsTable = true;
  console.warn(
    "booking_change_requests is unavailable; change request reads are disabled until the latest migration is applied.",
    error
  );
}

export function isMissingPaymentRefundColumnsError(
  error?: PostgrestLikeError | null
) {
  if (error?.code !== "42703") {
    return false;
  }

  const message = error.message ?? "";
  return PAYMENT_REFUND_TRACKING_COLUMNS.some(
    (columnName) =>
      message.includes(columnName) || message.includes(`payments.${columnName}`)
  );
}

export function warnForMissingPaymentRefundColumns(
  error?: PostgrestLikeError | null
) {
  if (hasWarnedForMissingPaymentRefundColumns) {
    return;
  }

  hasWarnedForMissingPaymentRefundColumns = true;
  console.warn(
    "Payment refund tracking columns are unavailable; refund metadata will be omitted until the latest migration is applied.",
    error
  );
}

export function isMissingBookingMeetingColumnsError(
  error?: PostgrestLikeError | null
) {
  if (error?.code !== "42703") {
    return false;
  }

  const message = error.message ?? "";
  return BOOKING_MEETING_COLUMNS.some(
    (columnName) =>
      message.includes(columnName) || message.includes(`bookings.${columnName}`)
  );
}

export function warnForMissingBookingMeetingColumns(
  error?: PostgrestLikeError | null
) {
  if (hasWarnedForMissingBookingMeetingColumns) {
    return;
  }

  hasWarnedForMissingBookingMeetingColumns = true;
  console.warn(
    "Booking meeting link columns are unavailable; meeting metadata will be omitted until the latest migration is applied.",
    error
  );
}

function throwUnavailableChangeRequestsFeature() {
  throw new BookingActionError(
    "Booking change requests are unavailable until the latest database migration is applied.",
    503
  );
}

function isBookingCancellationRequestable(status: BookingStatus | null) {
  return status === "pending" || status === "confirmed";
}

function isBookingCancelable(status: BookingStatus | null) {
  return (
    status === "pending" ||
    status === "confirmed" ||
    status === "cancellation_requested"
  );
}

function isCancelledBookingStatus(status: BookingStatus | null) {
  return status === "cancelled" || status === "cancelled_by_mentor";
}

function mapChangeRequestRow(
  row: ChangeRequestRow
): BookingChangeRequestSummary {
  return {
    id: row.id,
    bookingId: String(row.booking_id),
    requesterUserId: row.requester_user_id,
    type: row.type,
    status: row.status,
    reason: row.reason,
    reviewNote: row.review_note,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchBookingOrThrow(
  adminDb: ServiceClient,
  bookingId: string | number
) {
  const { data, error } = await adminDb
    .from("bookings")
    .select(
      "id, mentor_id, user_id, start_time, end_time, status, expires_at, meeting_join_url, meeting_host_url"
    )
    .eq("id", bookingId)
    .single();

  if (error || !data) {
    throw new BookingActionError("Booking not found.", 404);
  }

  return data as BookingRow;
}

async function fetchPaymentForBooking(
  adminDb: ServiceClient,
  bookingId: string | number
) {
  const paymentResult = await adminDb
    .from("payments")
    .select(
      "id, booking_id, stripe_payment_intent_id, amount, status, refund_amount"
    )
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (paymentResult.error) {
    if (isMissingPaymentRefundColumnsError(paymentResult.error)) {
      warnForMissingPaymentRefundColumns(paymentResult.error);

      const fallbackResult = await adminDb
        .from("payments")
        .select("id, booking_id, stripe_payment_intent_id, amount, status")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (fallbackResult.error) {
        throw new BookingActionError("Failed to load payment state.", 500);
      }

      if (!fallbackResult.data) {
        return null;
      }

      return {
        ...(fallbackResult.data as Omit<PaymentRow, "refund_amount">),
        refund_amount: null,
      } as PaymentRow;
    }

    throw new BookingActionError("Failed to load payment state.", 500);
  }

  return (paymentResult.data as PaymentRow | null) ?? null;
}

async function fetchChangeRequestOrThrow(
  adminDb: ServiceClient,
  requestId: string
) {
  const { data, error } = await adminDb
    .from("booking_change_requests")
    .select(
      `
        id,
        booking_id,
        requester_user_id,
        type,
        status,
        reason,
        review_note,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at
      `
    )
    .eq("id", requestId)
    .single();

  if (error || !data) {
    if (isMissingBookingChangeRequestsTableError(error)) {
      throwUnavailableChangeRequestsFeature();
    }
    throw new BookingActionError("Change request not found.", 404);
  }

  return data as ChangeRequestRow;
}

async function resolveChangeRequest(
  adminDb: ServiceClient,
  params: {
    requestId: string;
    status: BookingChangeRequestStatus;
    reviewedBy: string;
    reviewNote?: string | null;
  }
) {
  const { error } = await adminDb
    .from("booking_change_requests")
    .update({
      status: params.status,
      reviewed_by: params.reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_note: params.reviewNote?.trim() || null,
    })
    .eq("id", params.requestId);

  if (error) {
    if (isMissingBookingChangeRequestsTableError(error)) {
      throwUnavailableChangeRequestsFeature();
    }
    throw new BookingActionError("Failed to update the change request.", 500);
  }
}

async function fetchMentorOwner(
  adminDb: ServiceClient,
  mentorId: string
) {
  const { data, error } = await adminDb
    .from("mentors")
    .select("id, user_id")
    .eq("id", mentorId)
    .single();

  if (error || !data) {
    throw new BookingActionError("Mentor not found.", 404);
  }

  return data as MentorOwnerRow;
}

async function ensureNoPendingChangeRequest(
  adminDb: ServiceClient,
  bookingId: string | number
) {
  const { data, error } = await adminDb
    .from("booking_change_requests")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("type", "cancel")
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    if (isMissingBookingChangeRequestsTableError(error)) {
      throwUnavailableChangeRequestsFeature();
    }
    throw new BookingActionError("Failed to validate change requests.", 500);
  }

  if (data) {
    throw new BookingActionError(
      "There is already a pending change request for this booking.",
      409
    );
  }
}

async function resolvePendingCancellationRequestsForBooking(
  adminDb: ServiceClient,
  params: {
    bookingId: string | number;
    status: Exclude<BookingChangeRequestStatus, "pending">;
    reviewNote?: string | null;
    reviewedBy?: string | null;
  }
) {
  const updateResult = await adminDb
    .from("booking_change_requests")
    .update({
      status: params.status,
      reviewed_by: params.reviewedBy ?? null,
      reviewed_at: new Date().toISOString(),
      review_note: params.reviewNote?.trim() || null,
    })
    .eq("booking_id", params.bookingId)
    .eq("type", "cancel")
    .eq("status", "pending");

  if (updateResult.error) {
    if (isMissingBookingChangeRequestsTableError(updateResult.error)) {
      warnForMissingBookingChangeRequestsTable(updateResult.error);
      return;
    }

    throw new BookingActionError(
      "Failed to update the cancellation request state.",
      500
    );
  }
}

export async function getBookingChangeRequestsByBookingIds(
  bookingIds: Array<string | number>,
  adminDb = createSupabaseServiceClient()
) {
  if (bookingIds.length === 0) {
    return new Map<string, BookingChangeRequestSummary[]>();
  }

  const uniqueBookingIds = [...new Set(bookingIds.map(String))];
  const { data, error } = await adminDb
    .from("booking_change_requests")
    .select(
      `
        id,
        booking_id,
        requester_user_id,
        type,
        status,
        reason,
        review_note,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at
      `
    )
    .eq("type", "cancel")
    .in("booking_id", uniqueBookingIds)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingBookingChangeRequestsTableError(error)) {
      warnForMissingBookingChangeRequestsTable(error);
      return new Map<string, BookingChangeRequestSummary[]>();
    }

    throw new BookingActionError("Failed to load change requests.", 500);
  }

  const requestsByBookingId = new Map<string, BookingChangeRequestSummary[]>();

  for (const row of (data ?? []) as ChangeRequestRow[]) {
    const bookingKey = String(row.booking_id);
    const current = requestsByBookingId.get(bookingKey) ?? [];
    current.push(mapChangeRequestRow(row));
    requestsByBookingId.set(bookingKey, current);
  }

  return requestsByBookingId;
}

export async function createBookingChangeRequest(
  params: {
    bookingId: string;
    requesterUserId: string;
    type: BookingChangeRequestType;
    reason?: string | null;
  },
  adminDb = createSupabaseServiceClient()
) {
  const booking = await fetchBookingOrThrow(adminDb, params.bookingId);
  const mentor = await fetchMentorOwner(adminDb, booking.mentor_id);

  if (booking.user_id !== params.requesterUserId) {
    if (mentor.user_id === params.requesterUserId) {
      throw new BookingActionError(
        "Mentors cancel lessons immediately instead of submitting a cancellation request.",
        400
      );
    }

    throw new BookingActionError("You do not have access to this booking.", 403);
  }

  if (!isBookingCancellationRequestable(booking.status)) {
    throw new BookingActionError(
      "Only pending or confirmed bookings can request cancellation."
    );
  }

  await ensureNoPendingChangeRequest(adminDb, booking.id);

  const { data, error } = await adminDb
    .from("booking_change_requests")
    .insert({
      booking_id: booking.id,
      requester_user_id: params.requesterUserId,
      type: params.type,
      status: "pending",
      reason: params.reason?.trim() || null,
    })
    .select(
      `
        id,
        booking_id,
        requester_user_id,
        type,
        status,
        reason,
        review_note,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at
      `
    )
    .single();

  if (error || !data) {
    if (isMissingBookingChangeRequestsTableError(error)) {
      throwUnavailableChangeRequestsFeature();
    }
    throw new BookingActionError("Failed to create the change request.", 500);
  }

  const { error: bookingUpdateError } = await adminDb
    .from("bookings")
    .update({
      status: "cancellation_requested",
      expires_at: null,
    })
    .eq("id", booking.id)
    .in("status", ["pending", "confirmed"]);

  if (bookingUpdateError) {
    throw new BookingActionError(
      "Failed to update the booking cancellation state.",
      500
    );
  }

  const mappedRequest = mapChangeRequestRow(data as ChangeRequestRow);

  try {
    await sendStudentCancellationRequestSubmittedEmails({
      bookingId: booking.id,
      requestId: mappedRequest.id,
      reason: mappedRequest.reason,
    });
  } catch (notificationError) {
    console.error(
      "Failed to send student cancellation request notifications:",
      notificationError
    );
  }

  return mappedRequest;
}

export async function cancelBooking(
  params: {
    bookingId: string | number;
    bookingStatus?: Extract<BookingStatus, "cancelled" | "cancelled_by_mentor">;
  },
  adminDb = createSupabaseServiceClient()
) {
  const booking = await fetchBookingOrThrow(adminDb, params.bookingId);
  const nextStatus = params.bookingStatus ?? "cancelled";

  if (booking.status === nextStatus || isCancelledBookingStatus(booking.status)) {
    return { booking, payment: await fetchPaymentForBooking(adminDb, booking.id) };
  }

  if (booking.status === "completed") {
    throw new BookingActionError("Completed bookings cannot be cancelled.");
  }

  if (!isBookingCancelable(booking.status)) {
    throw new BookingActionError(
      "Only pending, confirmed, or cancellation-requested bookings can be cancelled."
    );
  }

  const payment = await fetchPaymentForBooking(adminDb, booking.id);

  if (payment?.status === "pending") {
    try {
      await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);
    } catch (error) {
      const stripeError = error as Stripe.errors.StripeError;
      if (stripeError.code !== "payment_intent_unexpected_state") {
        console.error("Failed to cancel the pending PaymentIntent:", error);
      }
    }

    const { error: paymentUpdateError } = await adminDb
      .from("payments")
      .update({
        status: "failed",
      })
      .eq("id", payment.id);

    if (paymentUpdateError) {
      throw new BookingActionError("Failed to update payment state.", 500);
    }
  }

  const { error: bookingUpdateError } = await adminDb
    .from("bookings")
    .update({
      status: nextStatus,
      expires_at: null,
    })
    .eq("id", booking.id);

  if (bookingUpdateError) {
    throw new BookingActionError("Failed to cancel the booking.", 500);
  }

  await resolveMeetingSetupIssue(booking.id, adminDb);

  return {
    booking: {
      ...booking,
      status: nextStatus,
      expires_at: null,
    },
    payment,
  };
}

export async function refundPayment(
  params: {
    paymentId: string;
    reason?: string | null;
  },
  adminDb = createSupabaseServiceClient()
) {
  const { data, error } = await adminDb
    .from("payments")
    .select(
      "id, booking_id, stripe_payment_intent_id, amount, status, refund_amount"
    )
    .eq("id", params.paymentId)
    .single();

  if (error || !data) {
    throw new BookingActionError("Payment not found.", 404);
  }

  const payment = data as PaymentRow;
  if (payment.status === "refunded" || payment.status === "refund_pending") {
    return { refund: null, payment };
  }

  if (payment.status !== "succeeded") {
    throw new BookingActionError("Only succeeded payments can be refunded.");
  }

  const refund = await stripe.refunds.create({
    payment_intent: payment.stripe_payment_intent_id,
    reverse_transfer: true,
    reason: "requested_by_customer",
  });

  const paymentUpdateResult = await adminDb
    .from("payments")
    .update({
      status: "refund_pending",
      stripe_refund_id: refund.id,
      refund_amount: payment.amount,
      refund_reason: params.reason?.trim() || null,
      refunded_at: null,
    })
    .eq("id", payment.id);

  if (paymentUpdateResult.error) {
    if (isMissingPaymentRefundColumnsError(paymentUpdateResult.error)) {
      warnForMissingPaymentRefundColumns(paymentUpdateResult.error);

      const fallbackUpdateResult = await adminDb
        .from("payments")
        .update({ status: "refund_pending" })
        .eq("id", payment.id);

      if (fallbackUpdateResult.error) {
        throw new BookingActionError("Failed to persist refund state.", 500);
      }
    } else {
      throw new BookingActionError("Failed to persist refund state.", 500);
    }
  }

  return { refund, payment };
}

export async function submitBookingCancellation(
  params: {
    bookingId: string | number;
    requesterUserId: string;
    reason?: string | null;
  },
  adminDb = createSupabaseServiceClient()
) {
  const booking = await fetchBookingOrThrow(adminDb, params.bookingId);
  const mentor = await fetchMentorOwner(adminDb, booking.mentor_id);

  if (params.requesterUserId === booking.user_id) {
    const changeRequest = await createBookingChangeRequest(
      {
        bookingId: String(booking.id),
        requesterUserId: params.requesterUserId,
        type: "cancel",
        reason: params.reason,
      },
      adminDb
    );

    return {
      mode: "request_submitted" as const,
      changeRequest,
    };
  }

  if (params.requesterUserId !== mentor.user_id) {
    throw new BookingActionError("You do not have access to this booking.", 403);
  }

  const cancellationReason = params.reason?.trim() || null;
  const { payment } = await cancelBooking(
    {
      bookingId: booking.id,
      bookingStatus: "cancelled_by_mentor",
    },
    adminDb
  );

  let refundState: CancellationRefundState = "not_applicable";

  if (payment?.status === "succeeded") {
    try {
      await refundPayment(
        {
          paymentId: payment.id,
          reason: cancellationReason,
        },
        adminDb
      );
      refundState = "pending";
    } catch (refundError) {
      refundState = "manual_follow_up";
      console.error("Failed to start mentor cancellation refund:", refundError);
    }
  }

  try {
    await resolvePendingCancellationRequestsForBooking(adminDb, {
      bookingId: booking.id,
      status: "approved",
      reviewNote:
        cancellationReason ??
        "Resolved automatically after the mentor cancelled the lesson.",
    });
  } catch (changeRequestError) {
    console.error(
      "Failed to resolve pending cancellation requests after mentor cancellation:",
      changeRequestError
    );
  }

  try {
    await sendMentorCancellationEmails({
      bookingId: booking.id,
      reason: cancellationReason,
      refundState,
    });
  } catch (notificationError) {
    console.error(
      "Failed to send mentor cancellation notifications:",
      notificationError
    );
  }

  return {
    mode: "cancelled_by_mentor" as const,
    bookingId: String(booking.id),
    refundState,
  };
}

export async function cancelBookingByAdmin(
  params: {
    bookingId: string | number;
    reason?: string | null;
    refundOnCancel?: boolean;
    reviewedBy?: string | null;
  },
  adminDb = createSupabaseServiceClient()
) {
  const cancellationReason = params.reason?.trim() || null;
  const { payment } = await cancelBooking(
    {
      bookingId: params.bookingId,
      bookingStatus: "cancelled",
    },
    adminDb
  );

  let refundState: CancellationRefundState = "not_applicable";

  if (params.refundOnCancel && payment?.status === "succeeded") {
    try {
      await refundPayment(
        {
          paymentId: payment.id,
          reason: cancellationReason,
        },
        adminDb
      );
      refundState = "pending";
    } catch (refundError) {
      refundState = "manual_follow_up";
      console.error("Failed to start admin cancellation refund:", refundError);
    }
  }

  try {
    await resolvePendingCancellationRequestsForBooking(adminDb, {
      bookingId: params.bookingId,
      status: "approved",
      reviewNote: cancellationReason,
      reviewedBy: params.reviewedBy ?? null,
    });
  } catch (changeRequestError) {
    console.error(
      "Failed to resolve pending cancellation requests during admin cancellation:",
      changeRequestError
    );
  }

  try {
    await sendCancellationApprovedEmails({
      bookingId: params.bookingId,
      reason: cancellationReason,
      refundState,
      eventKey: `admin-cancel-${params.bookingId}`,
    });
  } catch (notificationError) {
    console.error(
      "Failed to send admin cancellation notifications:",
      notificationError
    );
  }

  return { success: true, refundState };
}

export async function approveBookingChangeRequest(
  params: {
    requestId: string;
    reviewedBy: string;
    reviewNote?: string | null;
    refundOnCancel?: boolean;
  },
  adminDb = createSupabaseServiceClient()
) {
  const request = await fetchChangeRequestOrThrow(adminDb, params.requestId);
  if (request.status !== "pending") {
    throw new BookingActionError("This change request has already been resolved.");
  }

  if (request.type !== "cancel") {
    throw new BookingActionError(
      "Only cancellation requests are supported.",
      400
    );
  }

  const cancellationReason = params.reviewNote?.trim() || request.reason;
  const { payment } = await cancelBooking(
    {
      bookingId: request.booking_id,
      bookingStatus: "cancelled",
    },
    adminDb
  );

  let refundState: CancellationRefundState = "not_applicable";

  if (params.refundOnCancel && payment?.status === "succeeded") {
    try {
      await refundPayment(
        {
          paymentId: payment.id,
          reason: cancellationReason,
        },
        adminDb
      );
      refundState = "pending";
    } catch (refundError) {
      refundState = "manual_follow_up";
      console.error(
        "Failed to start refund while approving cancellation request:",
        refundError
      );
    }
  }

  await resolveChangeRequest(adminDb, {
    requestId: request.id,
    status: "approved",
    reviewedBy: params.reviewedBy,
    reviewNote: cancellationReason,
  });

  try {
    await sendCancellationApprovedEmails({
      bookingId: request.booking_id,
      requestId: request.id,
      reason: cancellationReason,
      refundState,
      eventKey: `approve-cancel-request-${request.id}`,
    });
  } catch (notificationError) {
    console.error(
      "Failed to send cancellation approval notifications:",
      notificationError
    );
  }

  return mapChangeRequestRow({
    ...request,
    status: "approved",
    reviewed_by: params.reviewedBy,
    reviewed_at: new Date().toISOString(),
    review_note: cancellationReason,
  });
}

export async function syncPaymentRefundFromStripe(
  params: {
    paymentIntentId: string;
    stripeRefundId: string | null;
    refundAmount: number;
    refundedAt?: string | null;
    refundReason?: string | null;
  },
  adminDb = createSupabaseServiceClient()
) {
  const { data, error } = await adminDb
    .from("payments")
    .select("id, booking_id, amount, status")
    .eq("stripe_payment_intent_id", params.paymentIntentId)
    .maybeSingle();

  if (error) {
    throw new BookingActionError("Failed to sync refund state.", 500);
  }

  if (!data) {
    return null;
  }

  const payment = data as {
    id: string;
    booking_id: number;
    amount: number;
    status: PaymentStatus;
  };

  if (payment.status === "refunded") {
    return {
      paymentId: payment.id,
      bookingId: payment.booking_id,
      statusChanged: false,
    };
  }

  const refundAmount = Math.max(params.refundAmount, 0);
  const refundedAt = params.refundedAt?.trim() || new Date().toISOString();

  const paymentUpdateResult = await adminDb
    .from("payments")
    .update({
      status: "refunded",
      stripe_refund_id: params.stripeRefundId,
      refund_amount: refundAmount,
      refund_reason: params.refundReason?.trim() || null,
      refunded_at: refundedAt,
    })
    .eq("id", payment.id);

  if (paymentUpdateResult.error) {
    if (isMissingPaymentRefundColumnsError(paymentUpdateResult.error)) {
      warnForMissingPaymentRefundColumns(paymentUpdateResult.error);

      const fallbackUpdateResult = await adminDb
        .from("payments")
        .update({ status: "refunded" })
        .eq("id", payment.id);

      if (fallbackUpdateResult.error) {
        throw new BookingActionError("Failed to persist refund state.", 500);
      }
    } else {
      throw new BookingActionError("Failed to persist refund state.", 500);
    }
  }

  if (refundAmount >= payment.amount) {
    const booking = await fetchBookingOrThrow(adminDb, payment.booking_id);
    if (
      booking.status !== "completed" &&
      booking.status !== "cancelled" &&
      booking.status !== "cancelled_by_mentor"
    ) {
      const { error: bookingUpdateError } = await adminDb
        .from("bookings")
        .update({
          status: "cancelled",
          expires_at: null,
        })
        .eq("id", payment.booking_id);

      if (bookingUpdateError) {
        throw new BookingActionError("Failed to sync booking cancellation.", 500);
      }
    }
  }

  return {
    paymentId: payment.id,
    bookingId: payment.booking_id,
    statusChanged: true,
  };
}
