import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from "./resend";

export type CancellationRefundState =
  | "not_applicable"
  | "pending"
  | "manual_follow_up";

type BookingRow = {
  id: number;
  start_time: string;
  end_time: string;
  user_id: string;
  mentor_id: string;
  status: string | null;
};

type PaymentRow = {
  id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
  refund_amount: number | null;
  refunded_at: string | null;
};

type MentorRow = {
  email: string | null;
  first_name: string | null;
  id: string;
  last_name: string | null;
  timezone: string | null;
  user_id: string;
};

type UserProfileRow = {
  first_name: string | null;
  id: string;
  last_name: string | null;
  timezone: string | null;
  username: string | null;
};

type NotificationContext = {
  adminEmails: string[];
  booking: BookingRow;
  mentor: MentorRow;
  mentorEmail: string | null;
  payment: PaymentRow | null;
  studentEmail: string | null;
  studentProfile: UserProfileRow | null;
};

type LessonDateTime = {
  dateLabel: string;
  timeLabel: string;
  timeZone: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeEmail(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeName(
  firstName?: string | null,
  lastName?: string | null,
  fallback = "there"
) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || fallback;
}

function parseStoredTimestamp(value: string) {
  return new Date(/[zZ]$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`);
}

function resolveTimeZone(value?: string | null) {
  if (!value) return "UTC";

  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return value;
  } catch {
    return "UTC";
  }
}

function formatLessonDateTime(
  startTime: string,
  endTime: string,
  preferredTimeZone?: string | null
): LessonDateTime {
  const timeZone = resolveTimeZone(preferredTimeZone);
  const start = parseStoredTimestamp(startTime);
  const end = parseStoredTimestamp(endTime);

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(start);

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return {
    dateLabel,
    timeLabel: `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`,
    timeZone,
  };
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function getMyLessonsUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return `${baseUrl}/settings?tab=my-lessons`;
}

function getAdminUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return `${baseUrl}/admin`;
}

function getFindMentorUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return `${baseUrl}/`;
}

function buildEmail({
  heading,
  intro,
  detailRows,
  ctaLabel,
  ctaUrl,
  footer,
}: {
  heading: string;
  intro: string;
  detailRows: Array<{ label: string; value: string }>;
  ctaLabel: string;
  ctaUrl: string;
  footer: string;
}) {
  const detailsHtml = detailRows
    .map(
      (row) => `
        <tr>
          <td style="padding: 10px 0; color: #64748b; font-size: 14px; vertical-align: top; width: 120px;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600; line-height: 1.6;">
            ${escapeHtml(row.value)}
          </td>
        </tr>
      `
    )
    .join("");

  const text = [
    "Bridgeee",
    "",
    heading,
    intro,
    "",
    ...detailRows.map((row) => `${row.label}: ${row.value}`),
    "",
    `${ctaLabel}: ${ctaUrl}`,
    "",
    footer,
  ].join("\n");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <body style="margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif;">
        <div style="margin: 0 auto; max-width: 640px; padding: 32px 20px;">
          <div style="border-radius: 20px; background: #ffffff; padding: 32px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);">
            <p style="margin: 0 0 12px; color: #2563eb; font-size: 14px; font-weight: 700;">Bridgeee</p>
            <h1 style="margin: 0; font-size: 28px; line-height: 1.25;">${escapeHtml(heading)}</h1>
            <p style="margin: 16px 0 0; color: #475569; font-size: 15px; line-height: 1.7;">${escapeHtml(intro)}</p>

            <table style="margin-top: 24px; width: 100%; border-collapse: collapse;">
              ${detailsHtml}
            </table>

            <div style="margin-top: 28px;">
              <a
                href="${escapeHtml(ctaUrl)}"
                style="display: inline-block; border-radius: 9999px; background: #2563eb; padding: 12px 20px; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none;"
              >
                ${escapeHtml(ctaLabel)}
              </a>
            </div>

            <p style="margin: 24px 0 0; color: #64748b; font-size: 13px; line-height: 1.7;">
              ${escapeHtml(footer)}
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { html, text };
}

function describeRefundState(
  refundState: CancellationRefundState,
  amountLabel: string | null
) {
  switch (refundState) {
    case "pending":
      return {
        admin: amountLabel
          ? `Refund initiated for ${amountLabel}.`
          : "Refund initiated.",
        mentor: "If a payment was captured, the refund has been initiated.",
        student: amountLabel
          ? `${amountLabel} refund initiated. Most banks reflect it within 5-10 business days.`
          : "Your refund has been initiated. Most banks reflect it within 5-10 business days.",
      };
    case "manual_follow_up":
      return {
        admin: "Refund could not be initiated automatically and needs manual follow-up.",
        mentor: "Bridgeee operations is following up on the refund manually.",
        student:
          "Bridgeee is reviewing your refund manually and will follow up as soon as possible.",
      };
    default:
      return {
        admin: "No refund was started for this cancellation.",
        mentor: "No refund was started for this cancellation.",
        student: "No refund is scheduled for this cancellation.",
      };
  }
}

async function getAdminEmails(adminDb: ReturnType<typeof createSupabaseServiceClient>) {
  const { data, error } = await adminDb.from("admin_users").select("user_id");

  if (error) {
    throw error;
  }

  const adminIds = [...new Set((data ?? []).map((row) => row.user_id as string))];

  const authResults = await Promise.all(
    adminIds.map((adminId) => adminDb.auth.admin.getUserById(adminId))
  );

  return authResults
    .map((result) => normalizeEmail(result.data.user?.email ?? null))
    .filter((email): email is string => Boolean(email));
}

async function loadContextByBookingId(bookingId: string | number) {
  const adminDb = createSupabaseServiceClient();

  const [bookingResult, adminEmails] = await Promise.all([
    adminDb
      .from("bookings")
      .select("id, start_time, end_time, user_id, mentor_id, status")
      .eq("id", bookingId)
      .single(),
    getAdminEmails(adminDb),
  ]);

  if (bookingResult.error || !bookingResult.data) {
    throw bookingResult.error ?? new Error("Booking not found.");
  }

  const booking = bookingResult.data as BookingRow;

  const [paymentResult, mentorResult, studentProfileResult, studentAuthResult] =
    await Promise.all([
      adminDb
        .from("payments")
        .select(
          "id, stripe_payment_intent_id, amount, currency, status, refund_amount, refunded_at"
        )
        .eq("booking_id", booking.id)
        .maybeSingle(),
      adminDb
        .from("mentors")
        .select("id, user_id, email, first_name, last_name, timezone")
        .eq("id", booking.mentor_id)
        .single(),
      adminDb
        .from("users")
        .select("id, first_name, last_name, timezone, username")
        .eq("id", booking.user_id)
        .maybeSingle(),
      adminDb.auth.admin.getUserById(booking.user_id),
    ]);

  if (paymentResult.error) {
    throw paymentResult.error;
  }

  if (mentorResult.error || !mentorResult.data) {
    throw mentorResult.error ?? new Error("Mentor not found.");
  }

  if (studentProfileResult.error) {
    throw studentProfileResult.error;
  }

  if (studentAuthResult.error) {
    throw studentAuthResult.error;
  }

  return {
    adminEmails,
    booking,
    mentor: mentorResult.data as MentorRow,
    mentorEmail: normalizeEmail(mentorResult.data.email),
    payment: (paymentResult.data as PaymentRow | null) ?? null,
    studentEmail: normalizeEmail(studentAuthResult.data.user?.email ?? null),
    studentProfile: (studentProfileResult.data as UserProfileRow | null) ?? null,
  } satisfies NotificationContext;
}

async function loadContextByPaymentIntentId(paymentIntentId: string) {
  const adminDb = createSupabaseServiceClient();
  const { data: payment, error } = await adminDb
    .from("payments")
    .select("booking_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (error || !payment) {
    throw error ?? new Error("Payment not found.");
  }

  return loadContextByBookingId(payment.booking_id);
}

export async function sendStudentCancellationRequestSubmittedEmails(params: {
  bookingId: string | number;
  requestId: string;
  reason?: string | null;
}) {
  if (!isTransactionalEmailConfigured()) {
    return;
  }

  const context = await loadContextByBookingId(params.bookingId);
  const studentName = normalizeName(
    context.studentProfile?.first_name,
    context.studentProfile?.last_name,
    context.studentProfile?.username ?? "Student"
  );
  const mentorName = normalizeName(
    context.mentor.first_name,
    context.mentor.last_name,
    "Mentor"
  );
  const adminUrl = getAdminUrl();
  const mentorUrl = getMyLessonsUrl();
  const studentTime = formatLessonDateTime(
    context.booking.start_time,
    context.booking.end_time,
    context.studentProfile?.timezone ?? context.mentor.timezone
  );
  const mentorTime = formatLessonDateTime(
    context.booking.start_time,
    context.booking.end_time,
    context.mentor.timezone
  );
  const reasonLabel = params.reason?.trim() || "No reason provided";

  if (context.adminEmails.length > 0) {
    const adminEmail = buildEmail({
      heading: "Student cancellation request submitted",
      intro: `${studentName} requested to cancel a booked lesson.`,
      detailRows: [
        { label: "Student", value: studentName },
        { label: "Mentor", value: mentorName },
        { label: "Date", value: studentTime.dateLabel },
        {
          label: "Time",
          value: `${studentTime.timeLabel} (${studentTime.timeZone})`,
        },
        { label: "Reason", value: reasonLabel },
      ],
      ctaLabel: "Open admin console",
      ctaUrl: adminUrl,
      footer: "Review the request and confirm whether the booking should be cancelled.",
    });

    await sendTransactionalEmail({
      to: context.adminEmails,
      subject: "Student cancellation request submitted",
      html: adminEmail.html,
      text: adminEmail.text,
      idempotencyKey: `student-cancel-request-admin-${params.requestId}`,
    });
  }

  if (context.mentorEmail) {
    const mentorEmail = buildEmail({
      heading: "A student requested to cancel a lesson",
      intro: `${studentName} submitted a cancellation request for an upcoming lesson.`,
      detailRows: [
        { label: "Student", value: studentName },
        { label: "Date", value: mentorTime.dateLabel },
        {
          label: "Time",
          value: `${mentorTime.timeLabel} (${mentorTime.timeZone})`,
        },
        { label: "Reason", value: reasonLabel },
      ],
      ctaLabel: "Open My Lessons",
      ctaUrl: mentorUrl,
      footer: "Bridgeee operations will review the request and follow up once the cancellation is confirmed.",
    });

    await sendTransactionalEmail({
      to: context.mentorEmail,
      subject: "A student requested to cancel a lesson",
      html: mentorEmail.html,
      text: mentorEmail.text,
      idempotencyKey: `student-cancel-request-mentor-${params.requestId}`,
    });
  }
}

export async function sendCancellationApprovedEmails(params: {
  bookingId: string | number;
  requestId?: string;
  reason?: string | null;
  refundState: CancellationRefundState;
  eventKey: string;
}) {
  if (!isTransactionalEmailConfigured()) {
    return;
  }

  const context = await loadContextByBookingId(params.bookingId);
  const studentName = normalizeName(
    context.studentProfile?.first_name,
    context.studentProfile?.last_name,
    context.studentProfile?.username ?? "Student"
  );
  const mentorName = normalizeName(
    context.mentor.first_name,
    context.mentor.last_name,
    "Mentor"
  );
  const amountLabel =
    context.payment && context.payment.amount > 0
      ? formatAmount(context.payment.amount, context.payment.currency)
      : null;
  const refundStateCopy = describeRefundState(params.refundState, amountLabel);
  const studentTime = formatLessonDateTime(
    context.booking.start_time,
    context.booking.end_time,
    context.studentProfile?.timezone ?? context.mentor.timezone
  );
  const mentorTime = formatLessonDateTime(
    context.booking.start_time,
    context.booking.end_time,
    context.mentor.timezone
  );
  const reasonLabel = params.reason?.trim() || "No extra note provided";

  if (context.studentEmail) {
    const studentEmail = buildEmail({
      heading: "Your lesson cancellation was approved",
      intro:
        "Bridgeee confirmed the cancellation request. You can review the latest booking state from My Lessons.",
      detailRows: [
        { label: "Mentor", value: mentorName },
        { label: "Date", value: studentTime.dateLabel },
        {
          label: "Time",
          value: `${studentTime.timeLabel} (${studentTime.timeZone})`,
        },
        { label: "Refund", value: refundStateCopy.student },
        { label: "Note", value: reasonLabel },
      ],
      ctaLabel: "Open My Lessons",
      ctaUrl: getMyLessonsUrl(),
      footer:
        params.refundState === "not_applicable"
          ? "You can book another lesson anytime from Bridgeee."
          : "If the refund does not appear after several business days, Bridgeee support can help.",
    });

    await sendTransactionalEmail({
      to: context.studentEmail,
      subject: "Your lesson cancellation was approved",
      html: studentEmail.html,
      text: studentEmail.text,
      idempotencyKey: `${params.eventKey}-student`,
    });
  }

  if (context.mentorEmail) {
    const mentorEmail = buildEmail({
      heading: "A booked lesson was cancelled",
      intro:
        "The cancellation has been finalized. The timeslot is now open for new bookings.",
      detailRows: [
        { label: "Student", value: studentName },
        { label: "Date", value: mentorTime.dateLabel },
        {
          label: "Time",
          value: `${mentorTime.timeLabel} (${mentorTime.timeZone})`,
        },
        { label: "Refund", value: refundStateCopy.mentor },
        { label: "Note", value: reasonLabel },
      ],
      ctaLabel: "Open My Lessons",
      ctaUrl: getMyLessonsUrl(),
      footer: "Bridgeee removed the lesson from the active schedule so the slot can be reused.",
    });

    await sendTransactionalEmail({
      to: context.mentorEmail,
      subject: "A booked lesson was cancelled",
      html: mentorEmail.html,
      text: mentorEmail.text,
      idempotencyKey: `${params.eventKey}-mentor`,
    });
  }
}

export async function sendMentorCancellationEmails(params: {
  bookingId: string | number;
  reason?: string | null;
  refundState: CancellationRefundState;
}) {
  if (!isTransactionalEmailConfigured()) {
    return;
  }

  const context = await loadContextByBookingId(params.bookingId);
  const studentName = normalizeName(
    context.studentProfile?.first_name,
    context.studentProfile?.last_name,
    context.studentProfile?.username ?? "Student"
  );
  const mentorName = normalizeName(
    context.mentor.first_name,
    context.mentor.last_name,
    "Mentor"
  );
  const amountLabel =
    context.payment && context.payment.amount > 0
      ? formatAmount(context.payment.amount, context.payment.currency)
      : null;
  const refundStateCopy = describeRefundState(params.refundState, amountLabel);
  const studentTime = formatLessonDateTime(
    context.booking.start_time,
    context.booking.end_time,
    context.studentProfile?.timezone ?? context.mentor.timezone
  );
  const reasonLabel = params.reason?.trim() || "No reason provided";

  if (context.studentEmail) {
    const studentEmail = buildEmail({
      heading: "Your mentor cancelled a lesson",
      intro:
        "This lesson was cancelled by the mentor. Bridgeee will help you move forward quickly.",
      detailRows: [
        { label: "Mentor", value: mentorName },
        { label: "Date", value: studentTime.dateLabel },
        {
          label: "Time",
          value: `${studentTime.timeLabel} (${studentTime.timeZone})`,
        },
        { label: "Reason", value: reasonLabel },
        { label: "Refund", value: refundStateCopy.student },
      ],
      ctaLabel: "Find another mentor",
      ctaUrl: getFindMentorUrl(),
      footer:
        "You can browse other mentors right away, and Bridgeee support can help if you need assistance.",
    });

    await sendTransactionalEmail({
      to: context.studentEmail,
      subject: "Your mentor cancelled a lesson",
      html: studentEmail.html,
      text: studentEmail.text,
      idempotencyKey: `mentor-cancel-student-${context.booking.id}`,
    });
  }

  if (context.adminEmails.length > 0) {
    const adminEmail = buildEmail({
      heading: "Mentor cancellation requires follow-up",
      intro: `${mentorName} cancelled a booked lesson.`,
      detailRows: [
        { label: "Student", value: studentName },
        { label: "Mentor", value: mentorName },
        { label: "Date", value: studentTime.dateLabel },
        {
          label: "Time",
          value: `${studentTime.timeLabel} (${studentTime.timeZone})`,
        },
        { label: "Reason", value: reasonLabel },
        { label: "Refund", value: refundStateCopy.admin },
      ],
      ctaLabel: "Open admin console",
      ctaUrl: getAdminUrl(),
      footer: "Please confirm the refund outcome and any additional student support that may be needed.",
    });

    await sendTransactionalEmail({
      to: context.adminEmails,
      subject: "Mentor cancellation requires follow-up",
      html: adminEmail.html,
      text: adminEmail.text,
      idempotencyKey: `mentor-cancel-admin-${context.booking.id}`,
    });
  }
}

export async function sendRefundCompletedEmail(params: {
  paymentIntentId: string;
  eventKey: string;
}) {
  if (!isTransactionalEmailConfigured()) {
    return;
  }

  const context = await loadContextByPaymentIntentId(params.paymentIntentId);

  if (!context.studentEmail || !context.payment) {
    return;
  }

  const mentorName = normalizeName(
    context.mentor.first_name,
    context.mentor.last_name,
    "Mentor"
  );
  const amountLabel = formatAmount(
    context.payment.refund_amount ?? context.payment.amount,
    context.payment.currency
  );
  const studentTime = formatLessonDateTime(
    context.booking.start_time,
    context.booking.end_time,
    context.studentProfile?.timezone ?? context.mentor.timezone
  );
  const studentEmail = buildEmail({
    heading: "Your refund has been processed",
    intro:
      "Bridgeee confirmed that your refund was completed successfully.",
    detailRows: [
      { label: "Mentor", value: mentorName },
      { label: "Date", value: studentTime.dateLabel },
      {
        label: "Time",
        value: `${studentTime.timeLabel} (${studentTime.timeZone})`,
      },
      { label: "Refund amount", value: amountLabel },
    ],
    ctaLabel: "Open My Lessons",
    ctaUrl: getMyLessonsUrl(),
    footer:
      "Most banks reflect refunded charges within 5-10 business days, though the exact timing depends on your card issuer.",
  });

  await sendTransactionalEmail({
    to: context.studentEmail,
    subject: "Your refund has been processed",
    html: studentEmail.html,
    text: studentEmail.text,
    idempotencyKey: `${params.eventKey}-student`,
  });
}
