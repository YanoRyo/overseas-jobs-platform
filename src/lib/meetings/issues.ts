import "server-only";

import {
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from "@/lib/email/resend";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>;

type PostgrestLikeError = {
  code?: string | null;
  message?: string | null;
};

type MeetingSetupIssueRow = {
  id: string;
  booking_id: number;
  provider: string | null;
  error_summary: string;
  error_details: string | null;
  status: "unresolved" | "resolved";
  failure_count: number;
  occurred_at: string;
  resolved_at: string | null;
  last_notified_at: string | null;
  created_at: string;
  updated_at: string;
};

type BookingContextRow = {
  id: number;
  start_time: string;
  end_time: string;
  meeting_join_url: string | null;
  meeting_host_url: string | null;
  mentor_id: string | null;
  user_id: string | null;
};

type MentorContextRow = {
  first_name: string | null;
  last_name: string | null;
  id: string;
};

type UserContextRow = {
  first_name: string | null;
  last_name: string | null;
  id: string;
  username: string | null;
};

const MEETING_SETUP_ISSUES_TABLE = "booking_meeting_setup_issues";
const ADMIN_NOTIFICATION_THROTTLE_MS = 15 * 60 * 1000;

let hasWarnedForMissingMeetingSetupIssuesTable = false;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string | null
) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || fallback || "Unknown";
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

function formatLessonDateTime(startTime: string, endTime: string) {
  const timeZone = resolveTimeZone(process.env.ADMIN_TIMEZONE);
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

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function getOperationsConsoleUrl() {
  return `${getBaseUrl()}/admin/payments`;
}

function formatMeetingLinkState(joinUrl?: string | null, hostUrl?: string | null) {
  if (joinUrl || hostUrl) {
    return "Meeting URL already present";
  }

  return "Meeting URL not set";
}

function formatErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return normalizeWhitespace(
      [error.message, error.stack].filter(Boolean).join("\n")
    ).slice(0, 4000);
  }

  if (typeof error === "string") {
    return normalizeWhitespace(error).slice(0, 4000);
  }

  try {
    return normalizeWhitespace(JSON.stringify(error)).slice(0, 4000);
  } catch {
    return "Unknown meeting setup error";
  }
}

export function summarizeMeetingSetupError(error: unknown) {
  if (error instanceof Error) {
    return normalizeWhitespace(error.message).slice(0, 240) || "Unknown error";
  }

  if (typeof error === "string") {
    return normalizeWhitespace(error).slice(0, 240) || "Unknown error";
  }

  return "Unexpected meeting setup error";
}

export function isMissingMeetingSetupIssuesTableError(
  error?: PostgrestLikeError | null
) {
  if (error?.code !== "42P01") {
    return false;
  }

  return (error.message ?? "").includes(MEETING_SETUP_ISSUES_TABLE);
}

export function warnForMissingMeetingSetupIssuesTable(
  error?: PostgrestLikeError | null
) {
  if (hasWarnedForMissingMeetingSetupIssuesTable) {
    return;
  }

  hasWarnedForMissingMeetingSetupIssuesTable = true;
  console.warn(
    "Meeting setup issue tracking is unavailable until the latest database migration is applied.",
    error
  );
}

export function isMeetingProviderAutoIssuanceEnabled() {
  const raw = process.env.MEETING_PROVIDER?.trim().toLowerCase();
  return Boolean(raw && raw !== "disabled" && raw !== "none");
}

async function getAdminEmails(adminDb: ServiceClient) {
  const { data, error } = await adminDb.from("admin_users").select("user_id");

  if (error) {
    throw error;
  }

  const adminIds = [...new Set((data ?? []).map((row) => row.user_id as string))];
  if (adminIds.length === 0) {
    return [];
  }

  const authResults = await Promise.all(
    adminIds.map((adminId) => adminDb.auth.admin.getUserById(adminId))
  );

  return authResults
    .map((result) => result.data.user?.email?.trim() ?? null)
    .filter((value): value is string => Boolean(value));
}

function buildMeetingSetupIssueEmail(params: {
  bookingId: number | string;
  mentorName: string;
  studentName: string;
  lessonDate: string;
  lessonTime: string;
  timeZone: string;
  provider: string;
  errorSummary: string;
  occurredAt: string;
  meetingLinkState: string;
}) {
  const ctaUrl = getOperationsConsoleUrl();
  const detailRows = [
    { label: "Booking", value: `#${params.bookingId}` },
    { label: "Mentor", value: params.mentorName },
    { label: "Student", value: params.studentName },
    {
      label: "Lesson",
      value: `${params.lessonDate} ${params.lessonTime} (${params.timeZone})`,
    },
    { label: "Provider", value: params.provider },
    { label: "Issue", value: params.errorSummary },
    { label: "Occurred", value: params.occurredAt },
    { label: "Meeting URL", value: params.meetingLinkState },
  ];

  const text = [
    "Bridgeee",
    "",
    "Meeting setup issue requires attention.",
    "",
    ...detailRows.map((row) => `${row.label}: ${row.value}`),
    "",
    `Open Operations Console: ${ctaUrl}`,
  ].join("\n");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <body style="margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif;">
        <div style="margin: 0 auto; max-width: 640px; padding: 32px 20px;">
          <div style="border-radius: 20px; background: #ffffff; padding: 32px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);">
            <p style="margin: 0 0 12px; color: #c2410c; font-size: 14px; font-weight: 700;">Bridgeee</p>
            <h1 style="margin: 0; font-size: 28px; line-height: 1.25;">Meeting setup issue requires attention</h1>
            <p style="margin: 16px 0 0; color: #475569; font-size: 15px; line-height: 1.7;">
              Bridgeee could not prepare the meeting URL automatically. Review the booking and set the meeting URL manually if needed.
            </p>
            <table style="margin-top: 24px; width: 100%; border-collapse: collapse;">
              ${detailRows
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
                .join("")}
            </table>
            <div style="margin-top: 28px;">
              <a
                href="${ctaUrl}"
                style="display: inline-block; border-radius: 9999px; background: #2563eb; padding: 12px 20px; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none;"
              >
                Open Operations Console
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return { html, text };
}

async function sendMeetingSetupIssueEmail(params: {
  bookingId: string | number;
  provider: string | null;
  errorSummary: string;
  occurredAt: string;
  adminDb: ServiceClient;
}) {
  if (!isTransactionalEmailConfigured()) {
    return;
  }

  const bookingId = Number(params.bookingId);
  if (!Number.isFinite(bookingId)) {
    return;
  }

  const [adminEmails, bookingResult] = await Promise.all([
    getAdminEmails(params.adminDb),
    params.adminDb
      .from("bookings")
      .select(
        "id, start_time, end_time, meeting_join_url, meeting_host_url, mentor_id, user_id"
      )
      .eq("id", bookingId)
      .maybeSingle(),
  ]);

  if (adminEmails.length === 0) {
    return;
  }

  if (bookingResult.error || !bookingResult.data) {
    return;
  }

  const booking = bookingResult.data as BookingContextRow;

  const [mentorResult, userResult] = await Promise.all([
    booking.mentor_id
      ? params.adminDb
          .from("mentors")
          .select("id, first_name, last_name")
          .eq("id", booking.mentor_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    booking.user_id
      ? params.adminDb
          .from("users")
          .select("id, first_name, last_name, username")
          .eq("id", booking.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const mentor = (mentorResult.data as MentorContextRow | null) ?? null;
  const student = (userResult.data as UserContextRow | null) ?? null;
  const lesson = formatLessonDateTime(booking.start_time, booking.end_time);
  const email = buildMeetingSetupIssueEmail({
    bookingId,
    mentorName: normalizeDisplayName(
      mentor?.first_name,
      mentor?.last_name,
      "Unknown mentor"
    ),
    studentName: normalizeDisplayName(
      student?.first_name,
      student?.last_name,
      student?.username ?? "Unknown student"
    ),
    lessonDate: lesson.dateLabel,
    lessonTime: lesson.timeLabel,
    timeZone: lesson.timeZone,
    provider: params.provider ?? "unknown",
    errorSummary: params.errorSummary,
    occurredAt: new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: lesson.timeZone,
    }).format(new Date(params.occurredAt)),
    meetingLinkState: formatMeetingLinkState(
      booking.meeting_join_url,
      booking.meeting_host_url
    ),
  });

  await sendTransactionalEmail({
    to: adminEmails,
    subject: `Bridgeee admin alert: meeting setup issue for booking #${bookingId}`,
    html: email.html,
    text: email.text,
    idempotencyKey: `meeting-setup-issue-${bookingId}-${params.occurredAt}`,
    tags: [
      { name: "category", value: "admin_meeting_setup_issue" },
      { name: "booking_id", value: String(bookingId) },
    ],
  });
}

export type MeetingSetupIssueRecord = {
  id: string;
  bookingId: number;
  provider: string | null;
  errorSummary: string;
  errorDetails: string | null;
  status: "unresolved" | "resolved";
  failureCount: number;
  occurredAt: string;
  resolvedAt: string | null;
  lastNotifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapMeetingSetupIssueRecord(row: MeetingSetupIssueRow): MeetingSetupIssueRecord {
  return {
    id: row.id,
    bookingId: row.booking_id,
    provider: row.provider,
    errorSummary: row.error_summary,
    errorDetails: row.error_details,
    status: row.status,
    failureCount: row.failure_count,
    occurredAt: row.occurred_at,
    resolvedAt: row.resolved_at,
    lastNotifiedAt: row.last_notified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getMeetingSetupIssuesByBookingIds(
  bookingIds: Array<string | number>,
  adminDb = createSupabaseServiceClient()
) {
  if (bookingIds.length === 0) {
    return new Map<string, MeetingSetupIssueRecord>();
  }

  const normalizedBookingIds = [...new Set(bookingIds.map((value) => Number(value)))].filter(
    (value) => Number.isFinite(value)
  );

  if (normalizedBookingIds.length === 0) {
    return new Map<string, MeetingSetupIssueRecord>();
  }

  const { data, error } = await adminDb
    .from(MEETING_SETUP_ISSUES_TABLE)
    .select(
      "id, booking_id, provider, error_summary, error_details, status, failure_count, occurred_at, resolved_at, last_notified_at, created_at, updated_at"
    )
    .eq("status", "unresolved")
    .in("booking_id", normalizedBookingIds)
    .order("occurred_at", { ascending: false });

  if (error) {
    if (isMissingMeetingSetupIssuesTableError(error)) {
      warnForMissingMeetingSetupIssuesTable(error);
      return new Map<string, MeetingSetupIssueRecord>();
    }

    throw error;
  }

  return new Map(
    ((data ?? []) as MeetingSetupIssueRow[]).map((row) => [
      String(row.booking_id),
      mapMeetingSetupIssueRecord(row),
    ])
  );
}

export async function recordMeetingSetupFailure(
  params: {
    bookingId: string | number;
    provider?: string | null;
    errorSummary: string;
    error?: unknown;
  },
  adminDb = createSupabaseServiceClient()
) {
  const bookingId = Number(params.bookingId);
  if (!Number.isFinite(bookingId)) {
    return null;
  }

  try {
    const { data: existing, error: existingError } = await adminDb
      .from(MEETING_SETUP_ISSUES_TABLE)
      .select(
        "id, booking_id, provider, error_summary, error_details, status, failure_count, occurred_at, resolved_at, last_notified_at, created_at, updated_at"
      )
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (existingError) {
      if (isMissingMeetingSetupIssuesTableError(existingError)) {
        warnForMissingMeetingSetupIssuesTable(existingError);
        return null;
      }

      throw existingError;
    }

    const now = new Date().toISOString();
    const existingRow = (existing as MeetingSetupIssueRow | null) ?? null;
    const lastNotifiedAt = existingRow?.last_notified_at
      ? new Date(existingRow.last_notified_at).getTime()
      : 0;
    const shouldNotify =
      !existingRow ||
      existingRow.status === "resolved" ||
      !lastNotifiedAt ||
      Date.now() - lastNotifiedAt >= ADMIN_NOTIFICATION_THROTTLE_MS;

    const values = {
      booking_id: bookingId,
      provider: params.provider?.trim() || null,
      error_summary:
        normalizeWhitespace(params.errorSummary).slice(0, 240) || "Unknown error",
      error_details: formatErrorDetails(params.error),
      status: "unresolved" as const,
      failure_count: (existingRow?.failure_count ?? 0) + 1,
      occurred_at: now,
      resolved_at: null,
      last_notified_at: shouldNotify ? now : existingRow?.last_notified_at ?? null,
    };

    const selection =
      "id, booking_id, provider, error_summary, error_details, status, failure_count, occurred_at, resolved_at, last_notified_at, created_at, updated_at";

    const saveResult = existingRow
      ? await adminDb
          .from(MEETING_SETUP_ISSUES_TABLE)
          .update(values)
          .eq("id", existingRow.id)
          .select(selection)
          .single()
      : await adminDb
          .from(MEETING_SETUP_ISSUES_TABLE)
          .insert(values)
          .select(selection)
          .single();

    const { data: saved, error: saveError } = saveResult;

    if (saveError || !saved) {
      if (isMissingMeetingSetupIssuesTableError(saveError)) {
        warnForMissingMeetingSetupIssuesTable(saveError);
        return null;
      }

      throw saveError ?? new Error("Failed to save meeting setup issue.");
    }

    if (shouldNotify) {
      try {
        await sendMeetingSetupIssueEmail({
          bookingId,
          provider: values.provider,
          errorSummary: values.error_summary,
          occurredAt: now,
          adminDb,
        });
      } catch (notificationError) {
        console.error(
          "Failed to send admin meeting setup issue notifications:",
          notificationError
        );
      }
    }

    return mapMeetingSetupIssueRecord(saved as MeetingSetupIssueRow);
  } catch (error) {
    console.error("Failed to record meeting setup failure:", error);
    return null;
  }
}

export async function resolveMeetingSetupIssue(
  bookingId: string | number,
  adminDb = createSupabaseServiceClient()
) {
  const normalizedBookingId = Number(bookingId);
  if (!Number.isFinite(normalizedBookingId)) {
    return false;
  }

  try {
    const { error } = await adminDb
      .from(MEETING_SETUP_ISSUES_TABLE)
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("booking_id", normalizedBookingId)
      .eq("status", "unresolved");

    if (error) {
      if (isMissingMeetingSetupIssuesTableError(error)) {
        warnForMissingMeetingSetupIssuesTable(error);
        return false;
      }

      throw error;
    }

    return true;
  } catch (error) {
    console.error("Failed to resolve meeting setup issue:", error);
    return false;
  }
}
