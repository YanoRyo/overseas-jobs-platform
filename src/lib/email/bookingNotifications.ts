import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from "./resend";

type PaymentEmailRow = {
  id: string;
  booking_id: string;
  user_id: string;
  mentor_id: string;
  amount: number;
  currency: string;
  stripe_payment_intent_id: string;
  student_confirmation_email_sent_at: string | null;
  mentor_booking_email_sent_at: string | null;
};

type BookingEmailRow = {
  id: string;
  start_time: string;
  end_time: string;
  meeting_join_url: string | null;
};

type MentorEmailRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  timezone: string | null;
};

type StudentProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  timezone: string | null;
};

type LessonDateTime = {
  dateLabel: string;
  timeLabel: string;
  timeZone: string;
};

type PostgrestLikeError = {
  code?: string | null;
  message?: string | null;
};

const BOOKING_EMAIL_TRACKING_COLUMNS = [
  "student_confirmation_email_sent_at",
  "student_confirmation_email_id",
  "mentor_booking_email_sent_at",
  "mentor_booking_email_id",
] as const;

let hasWarnedForMissingBookingEmailTrackingColumns = false;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeName(
  firstName?: string | null,
  lastName?: string | null,
  fallback = "there"
) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || fallback;
}

function normalizeEmail(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function isMissingBookingEmailTrackingColumnError(error?: PostgrestLikeError | null) {
  if (error?.code !== "42703") {
    return false;
  }

  const message = error.message ?? "";
  return BOOKING_EMAIL_TRACKING_COLUMNS.some(
    (columnName) =>
      message.includes(columnName) || message.includes(`payments.${columnName}`)
  );
}

function warnForMissingBookingEmailTrackingColumns(error?: PostgrestLikeError | null) {
  if (hasWarnedForMissingBookingEmailTrackingColumns) {
    return;
  }

  hasWarnedForMissingBookingEmailTrackingColumns = true;
  console.warn(
    "Booking email tracking columns are unavailable; falling back to provider idempotency until the payments migration is applied.",
    error
  );
}

function parseStoredTimestamp(value: string) {
  return new Date(value.endsWith("Z") ? value : `${value}Z`);
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

  const startLabel = timeFormatter.format(start);
  const endLabel = timeFormatter.format(end);

  return {
    dateLabel,
    timeLabel: `${startLabel} - ${endLabel}`,
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
          <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600;">
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

async function markStudentEmailSent(
  paymentId: string,
  emailId: string,
  trackingColumnsAvailable: boolean
) {
  if (!trackingColumnsAvailable) {
    return;
  }

  const adminDb = createSupabaseServiceClient();
  const { error } = await adminDb
    .from("payments")
    .update({
      student_confirmation_email_sent_at: new Date().toISOString(),
      student_confirmation_email_id: emailId,
    })
    .eq("id", paymentId)
    .is("student_confirmation_email_sent_at", null);

  if (error) {
    if (isMissingBookingEmailTrackingColumnError(error)) {
      warnForMissingBookingEmailTrackingColumns(error);
      return;
    }

    console.error("Failed to persist student confirmation email state:", error);
    throw error;
  }
}

async function markMentorEmailSent(
  paymentId: string,
  emailId: string,
  trackingColumnsAvailable: boolean
) {
  if (!trackingColumnsAvailable) {
    return;
  }

  const adminDb = createSupabaseServiceClient();
  const { error } = await adminDb
    .from("payments")
    .update({
      mentor_booking_email_sent_at: new Date().toISOString(),
      mentor_booking_email_id: emailId,
    })
    .eq("id", paymentId)
    .is("mentor_booking_email_sent_at", null);

  if (error) {
    if (isMissingBookingEmailTrackingColumnError(error)) {
      warnForMissingBookingEmailTrackingColumns(error);
      return;
    }

    console.error("Failed to persist mentor booking email state:", error);
    throw error;
  }
}

async function fetchPaymentForBookingEmails(paymentIntentId: string) {
  const adminDb = createSupabaseServiceClient();
  const trackedPaymentSelect =
    "id, booking_id, user_id, mentor_id, amount, currency, stripe_payment_intent_id, student_confirmation_email_sent_at, mentor_booking_email_sent_at";

  const trackedPaymentResult = await adminDb
    .from("payments")
    .select(trackedPaymentSelect)
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();

  if (!trackedPaymentResult.error) {
    return {
      paymentRow: trackedPaymentResult.data as PaymentEmailRow | null,
      trackingColumnsAvailable: true,
    };
  }

  if (!isMissingBookingEmailTrackingColumnError(trackedPaymentResult.error)) {
    console.error(
      "Failed to fetch payment for booking emails:",
      trackedPaymentResult.error
    );
    throw trackedPaymentResult.error;
  }

  warnForMissingBookingEmailTrackingColumns(trackedPaymentResult.error);

  const { data: payment, error: paymentError } = await adminDb
    .from("payments")
    .select(
      "id, booking_id, user_id, mentor_id, amount, currency, stripe_payment_intent_id"
    )
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();

  if (paymentError) {
    console.error("Failed to fetch payment for booking emails:", paymentError);
    throw paymentError;
  }

  return {
    paymentRow: payment
      ? ({
          ...payment,
          student_confirmation_email_sent_at: null,
          mentor_booking_email_sent_at: null,
        } as PaymentEmailRow)
      : null,
    trackingColumnsAvailable: false,
  };
}

export async function sendBookingNotificationEmails(
  paymentIntentId: string
) {
  if (!isTransactionalEmailConfigured()) {
    return;
  }

  const adminDb = createSupabaseServiceClient();
  const { paymentRow, trackingColumnsAvailable } =
    await fetchPaymentForBookingEmails(paymentIntentId);

  if (!paymentRow) {
    return;
  }

  if (
    paymentRow.student_confirmation_email_sent_at &&
    paymentRow.mentor_booking_email_sent_at
  ) {
    return;
  }

  const [
    bookingResult,
    mentorResult,
    studentProfileResult,
    studentAuthResult,
  ] = await Promise.all([
    adminDb
      .from("bookings")
      .select("id, start_time, end_time, meeting_join_url")
      .eq("id", paymentRow.booking_id)
      .single(),
    adminDb
      .from("mentors")
      .select("id, email, first_name, last_name, timezone")
      .eq("id", paymentRow.mentor_id)
      .single(),
    adminDb
      .from("users")
      .select("id, first_name, last_name, timezone")
      .eq("id", paymentRow.user_id)
      .maybeSingle(),
    adminDb.auth.admin.getUserById(paymentRow.user_id),
  ]);

  if (bookingResult.error) {
    console.error("Failed to fetch booking for booking emails:", bookingResult.error);
    throw bookingResult.error;
  }

  if (mentorResult.error) {
    console.error("Failed to fetch mentor for booking emails:", mentorResult.error);
    throw mentorResult.error;
  }

  if (studentProfileResult.error) {
    console.error(
      "Failed to fetch student profile for booking emails:",
      studentProfileResult.error
    );
    throw studentProfileResult.error;
  }

  if (studentAuthResult.error) {
    console.error(
      "Failed to fetch auth user for booking emails:",
      studentAuthResult.error
    );
    throw studentAuthResult.error;
  }

  const booking = bookingResult.data as BookingEmailRow | null;
  const mentor = mentorResult.data as MentorEmailRow | null;
  const studentProfile = studentProfileResult.data as StudentProfileRow | null;
  const studentEmail = normalizeEmail(studentAuthResult.data.user?.email);

  if (!booking || !mentor) {
    return;
  }

  const mentorName = normalizeName(mentor.first_name, mentor.last_name, "Mentor");
  const studentName = normalizeName(
    studentProfile?.first_name,
    studentProfile?.last_name,
    studentEmail ?? "Student"
  );
  const mentorEmail = normalizeEmail(mentor.email);
  const myLessonsUrl = getMyLessonsUrl();
  const amountLabel = formatAmount(paymentRow.amount, paymentRow.currency);
  const studentLessonDateTime = formatLessonDateTime(
    booking.start_time,
    booking.end_time,
    studentProfile?.timezone ?? mentor.timezone
  );
  const mentorLessonDateTime = formatLessonDateTime(
    booking.start_time,
    booking.end_time,
    mentor.timezone
  );
  const meetingStatusText = booking.meeting_join_url
    ? "Your meeting link is ready in My Lessons."
    : "Your meeting link will appear in My Lessons shortly.";

  if (!paymentRow.student_confirmation_email_sent_at && studentEmail) {
    const studentEmailContent = buildEmail({
      heading: "Your Bridgeee lesson is confirmed",
      intro:
        "We confirmed your payment and reserved your lesson. You can review the booking anytime from My Lessons.",
      detailRows: [
        { label: "Mentor", value: mentorName },
        { label: "Date", value: studentLessonDateTime.dateLabel },
        {
          label: "Time",
          value: `${studentLessonDateTime.timeLabel} (${studentLessonDateTime.timeZone})`,
        },
        { label: "Amount", value: amountLabel },
      ],
      ctaLabel: "Open My Lessons",
      ctaUrl: myLessonsUrl,
      footer: meetingStatusText,
    });

    const sent = await sendTransactionalEmail({
      to: studentEmail,
      subject: "Your Bridgeee lesson is confirmed",
      html: studentEmailContent.html,
      idempotencyKey: `student-booking-confirmation-${paymentRow.stripe_payment_intent_id}`,
    });

    if (sent?.id) {
      await markStudentEmailSent(
        paymentRow.id,
        sent.id,
        trackingColumnsAvailable
      );
    }
  } else if (!studentEmail) {
    console.warn(
      `Skipped student booking confirmation email because no auth email was found for user ${paymentRow.user_id}.`
    );
  }

  if (!paymentRow.mentor_booking_email_sent_at && mentorEmail) {
    const mentorEmailContent = buildEmail({
      heading: "You have a new booking on Bridgeee",
      intro:
        "A student completed payment and the lesson is now confirmed. You can review the booking from My Lessons.",
      detailRows: [
        { label: "Student", value: studentName },
        { label: "Date", value: mentorLessonDateTime.dateLabel },
        {
          label: "Time",
          value: `${mentorLessonDateTime.timeLabel} (${mentorLessonDateTime.timeZone})`,
        },
      ],
      ctaLabel: "Open My Lessons",
      ctaUrl: myLessonsUrl,
      footer: "Use My Lessons to review the reservation details and open the meeting link.",
    });

    const sent = await sendTransactionalEmail({
      to: mentorEmail,
      subject: "You have a new booking on Bridgeee",
      html: mentorEmailContent.html,
      idempotencyKey: `mentor-booking-notification-${paymentRow.stripe_payment_intent_id}`,
    });

    if (sent?.id) {
      await markMentorEmailSent(
        paymentRow.id,
        sent.id,
        trackingColumnsAvailable
      );
    }
  } else if (!mentorEmail) {
    console.warn(
      `Skipped mentor booking notification email because no mentor email was found for mentor ${paymentRow.mentor_id}.`
    );
  }
}
