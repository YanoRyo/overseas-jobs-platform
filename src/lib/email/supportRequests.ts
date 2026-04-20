import "server-only";

import { createHash } from "node:crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { SupportRequestCategory } from "@/features/support/constants";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from "./resend";

type SendSupportRequestNotificationInput = {
  requestId: string;
  category: SupportRequestCategory;
  context: string | null;
  email: string;
  locale: string | null;
  message: string;
  name: string;
  userId: string | null;
};

type SendSupportRequestNotificationResult =
  | { ok: true; recipientCount: number }
  | { ok: false; reason: "email_not_configured" | "no_recipients" };

type SendSupportReplyEmailInput = {
  category: SupportRequestCategory;
  context: string | null;
  recipientEmail: string;
  recipientName: string;
  replyId: string;
  requestId: string;
  responseBody: string;
  subject: string;
};

type AdminUserRow = {
  user_id: string;
};

const SUPPORT_CATEGORY_LABELS: Record<SupportRequestCategory, string> = {
  payment: "Payment issue",
  schedule_change: "Schedule change request",
  no_response: "Cannot reach the other person",
  trouble_report: "Trouble report",
  other: "Other",
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

function isValidEmailAddress(value: string) {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

function parseSupportInboxOverride(value?: string | null) {
  return [
    ...new Set(
      (value ?? "")
        .split(/[,\n;]/)
        .map((item) => item.trim())
        .filter((item) => item && isValidEmailAddress(item))
    ),
  ];
}

async function getAdminEmails() {
  const adminDb = createSupabaseServiceClient();
  const { data, error } = await adminDb
    .from("admin_users")
    .select("user_id");

  if (error) {
    throw error;
  }

  const adminIds = [...new Set(
    ((data ?? []) as AdminUserRow[]).map((row) => row.user_id)
  )];

  if (adminIds.length === 0) {
    return [];
  }

  const authResults = await Promise.all(
    adminIds.map((adminId) => adminDb.auth.admin.getUserById(adminId))
  );

  return [...new Set(
    authResults
      .map((result) => normalizeEmail(result.data.user?.email ?? null))
      .filter(
        (value): value is string => Boolean(value && isValidEmailAddress(value))
      )
  )];
}

function getSupportRecipientEmails() {
  const overrideRecipients = parseSupportInboxOverride(process.env.SUPPORT_EMAIL);

  if (overrideRecipients.length > 0) {
    return Promise.resolve(overrideRecipients);
  }

  return getAdminEmails();
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function getAdminSupportUrl() {
  return `${getBaseUrl()}/admin/support`;
}

function getPublicSupportUrl() {
  return `${getBaseUrl()}/support`;
}

function buildSupportRequestEmail(input: SendSupportRequestNotificationInput) {
  const categoryLabel = SUPPORT_CATEGORY_LABELS[input.category];
  const adminSupportUrl = getAdminSupportUrl();
  const detailRows = [
    { label: "Request ID", value: input.requestId },
    { label: "Requester", value: input.name },
    { label: "Reply email", value: input.email },
    { label: "Topic", value: categoryLabel },
    ...(input.context ? [{ label: "Booking / mentor", value: input.context }] : []),
    ...(input.locale ? [{ label: "Locale", value: input.locale }] : []),
    ...(input.userId ? [{ label: "User ID", value: input.userId }] : []),
    { label: "Submitted at", value: new Date().toISOString() },
  ];

  const detailsText = detailRows.map((row) => `${row.label}: ${row.value}`);
  const detailsHtml = detailRows
    .map(
      (row) => `
        <tr>
          <td style="padding: 10px 0; width: 140px; color: #64748b; font-size: 14px; vertical-align: top;">
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
    "Bridgeee support request",
    "",
    ...detailsText,
    "",
    "Message:",
    input.message,
    "",
    `Open admin support queue: ${adminSupportUrl}`,
  ].join("\n");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <body style="margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif;">
        <div style="margin: 0 auto; max-width: 680px; padding: 32px 20px;">
          <div style="border-radius: 24px; background: #ffffff; padding: 32px; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);">
            <p style="margin: 0 0 12px; color: #2563eb; font-size: 14px; font-weight: 700;">Bridgeee Support</p>
            <h1 style="margin: 0; font-size: 28px; line-height: 1.25;">New support request received</h1>
            <p style="margin: 16px 0 0; color: #475569; font-size: 15px; line-height: 1.7;">
              A user submitted a new support request through the public support page.
            </p>

            <table style="margin-top: 24px; width: 100%; border-collapse: collapse;">
              ${detailsHtml}
            </table>

            <div style="margin-top: 28px; border-radius: 18px; background: #eff6ff; padding: 20px;">
              <p style="margin: 0 0 10px; color: #1d4ed8; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;">
                Message
              </p>
              <p style="margin: 0; color: #0f172a; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">
                ${escapeHtml(input.message)}
              </p>
            </div>

            <div style="margin-top: 28px;">
              <a
                href="${escapeHtml(adminSupportUrl)}"
                style="display: inline-block; border-radius: 9999px; background: #2563eb; padding: 12px 20px; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none;"
              >
                Open Admin Support Queue
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return {
    categoryLabel,
    html,
    text,
  };
}

function buildIdempotencyKey(input: SendSupportRequestNotificationInput) {
  const digest = createHash("sha256")
    .update(
      [
        input.requestId,
        input.name,
        input.email,
        input.category,
        input.context ?? "",
        input.message,
        input.userId ?? "",
      ].join("\n")
    )
    .digest("hex");

  return `support-request-${digest}`;
}

function buildSupportReplyEmail(input: SendSupportReplyEmailInput) {
  const categoryLabel = SUPPORT_CATEGORY_LABELS[input.category];
  const supportUrl = getPublicSupportUrl();
  const detailRows = [
    { label: "Request ID", value: input.requestId },
    { label: "Topic", value: categoryLabel },
    ...(input.context ? [{ label: "Reference", value: input.context }] : []),
  ];

  const detailHtml = detailRows
    .map(
      (row) => `
        <tr>
          <td style="padding: 8px 0; width: 110px; color: #64748b; font-size: 14px; vertical-align: top;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600; line-height: 1.6;">
            ${escapeHtml(row.value)}
          </td>
        </tr>
      `
    )
    .join("");

  const text = [
    `Hi ${input.recipientName},`,
    "",
    "Bridgeee support replied to your request.",
    "",
    ...detailRows.map((row) => `${row.label}: ${row.value}`),
    "",
    input.responseBody,
    "",
    `Support page: ${supportUrl}`,
  ].join("\n");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <body style="margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif;">
        <div style="margin: 0 auto; max-width: 680px; padding: 32px 20px;">
          <div style="border-radius: 24px; background: #ffffff; padding: 32px; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);">
            <p style="margin: 0 0 12px; color: #2563eb; font-size: 14px; font-weight: 700;">Bridgeee Support</p>
            <h1 style="margin: 0; font-size: 28px; line-height: 1.25;">We replied to your request</h1>
            <p style="margin: 16px 0 0; color: #475569; font-size: 15px; line-height: 1.7;">
              ${escapeHtml(`Hi ${input.recipientName}, here is our reply regarding your recent Bridgeee support request.`)}
            </p>

            <table style="margin-top: 24px; width: 100%; border-collapse: collapse;">
              ${detailHtml}
            </table>

            <div style="margin-top: 28px; border-radius: 18px; background: #eff6ff; padding: 20px;">
              <p style="margin: 0 0 10px; color: #1d4ed8; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;">
                Reply
              </p>
              <p style="margin: 0; color: #0f172a; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">
                ${escapeHtml(input.responseBody)}
              </p>
            </div>

            <p style="margin: 24px 0 0; color: #475569; font-size: 14px; line-height: 1.7;">
              If you need to share more details, please use the support form again so the Bridgeee team can track the follow-up.
            </p>

            <div style="margin-top: 24px;">
              <a
                href="${escapeHtml(supportUrl)}"
                style="display: inline-block; border-radius: 9999px; background: #2563eb; padding: 12px 20px; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none;"
              >
                Open Support Page
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return { html, text };
}

export async function sendSupportRequestNotification(
  input: SendSupportRequestNotificationInput
): Promise<SendSupportRequestNotificationResult> {
  if (!isTransactionalEmailConfigured()) {
    return { ok: false, reason: "email_not_configured" };
  }

  const recipients = await getSupportRecipientEmails();

  if (recipients.length === 0) {
    return { ok: false, reason: "no_recipients" };
  }

  const email = buildSupportRequestEmail(input);

  await sendTransactionalEmail({
    to: recipients,
    subject: `Bridgeee support request: ${email.categoryLabel}`,
    html: email.html,
    text: email.text,
    idempotencyKey: buildIdempotencyKey(input),
    tags: [
      { name: "category", value: "support_request" },
      { name: "topic", value: input.category },
    ],
  });

  return { ok: true, recipientCount: recipients.length };
}

export async function sendSupportReplyEmail(
  input: SendSupportReplyEmailInput
): Promise<SendSupportRequestNotificationResult> {
  if (!isTransactionalEmailConfigured()) {
    return { ok: false, reason: "email_not_configured" };
  }

  const email = buildSupportReplyEmail(input);

  await sendTransactionalEmail({
    to: input.recipientEmail,
    subject: input.subject,
    html: email.html,
    text: email.text,
    idempotencyKey: `support-reply-${input.replyId}`,
    tags: [
      { name: "category", value: "support_reply" },
      { name: "topic", value: input.category },
    ],
  });

  return { ok: true, recipientCount: 1 };
}
