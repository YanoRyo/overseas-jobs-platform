import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from "./resend";

type MessageNotificationInput = {
  category?: string | null;
  messageBody: string;
  messageId: number;
  recipientId: string;
  senderId: string;
};

type UserProfileRow = {
  first_name: string | null;
  id: string;
  last_name: string | null;
  username: string;
};

type MentorProfileRow = {
  email: string;
  first_name: string;
  last_name: string;
  user_id: string;
};

const MESSAGE_CATEGORY_LABELS: Record<string, string> = {
  career: "Working abroad",
  interview: "Interview preparation",
  other: "Other",
  visa: "Visa questions",
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

function resolveDisplayName(
  userId: string,
  users: Map<string, UserProfileRow>,
  mentors: Map<string, MentorProfileRow>,
  fallback: string
) {
  const mentor = mentors.get(userId);
  if (mentor) {
    return normalizeName(mentor.first_name, mentor.last_name, fallback);
  }

  const user = users.get(userId);
  if (user) {
    return normalizeName(
      user.first_name,
      user.last_name,
      user.username || fallback
    );
  }

  return fallback;
}

function getMessagesUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return `${baseUrl}/settings?tab=messages`;
}

function formatCategory(category?: string | null) {
  if (!category) {
    return null;
  }

  return MESSAGE_CATEGORY_LABELS[category] ?? category;
}

function summarizeMessage(value: string, maxLength = 280) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}...`;
}

function buildMessageEmail({
  category,
  messagePreview,
  messagesUrl,
  recipientName,
  senderName,
}: {
  category: string | null;
  messagePreview: string;
  messagesUrl: string;
  recipientName: string;
  senderName: string;
}) {
  const detailRows = [
    { label: "From", value: senderName },
    ...(category ? [{ label: "Topic", value: category }] : []),
    { label: "Message", value: messagePreview },
  ];

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

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <body style="margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif;">
        <div style="margin: 0 auto; max-width: 640px; padding: 32px 20px;">
          <div style="border-radius: 20px; background: #ffffff; padding: 32px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);">
            <p style="margin: 0 0 12px; color: #2563eb; font-size: 14px; font-weight: 700;">Bridgeee</p>
            <h1 style="margin: 0; font-size: 28px; line-height: 1.25;">You have a new message</h1>
            <p style="margin: 16px 0 0; color: #475569; font-size: 15px; line-height: 1.7;">
              ${escapeHtml(`Hi ${recipientName}, ${senderName} sent you a new message on Bridgeee.`)}
            </p>

            <table style="margin-top: 24px; width: 100%; border-collapse: collapse;">
              ${detailsHtml}
            </table>

            <div style="margin-top: 28px;">
              <a
                href="${escapeHtml(messagesUrl)}"
                style="display: inline-block; border-radius: 9999px; background: #2563eb; padding: 12px 20px; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none;"
              >
                Open Messages
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return { html };
}

export async function sendNewMessageNotificationEmail(
  input: MessageNotificationInput
) {
  if (!isTransactionalEmailConfigured()) {
    return;
  }

  if (input.senderId === input.recipientId) {
    return;
  }

  const adminDb = createSupabaseServiceClient();
  const uniqueUserIds = [...new Set([input.senderId, input.recipientId])];

  const [usersResult, mentorsResult, recipientAuthResult] = await Promise.all([
    adminDb
      .from("users")
      .select("id, username, first_name, last_name")
      .in("id", uniqueUserIds),
    adminDb
      .from("mentors")
      .select("user_id, first_name, last_name, email")
      .in("user_id", uniqueUserIds),
    adminDb.auth.admin.getUserById(input.recipientId),
  ]);

  if (usersResult.error) {
    throw usersResult.error;
  }

  if (mentorsResult.error) {
    throw mentorsResult.error;
  }

  if (recipientAuthResult.error) {
    throw recipientAuthResult.error;
  }

  const userMap = new Map(
    ((usersResult.data ?? []) as UserProfileRow[]).map((row) => [row.id, row])
  );
  const mentorMap = new Map(
    ((mentorsResult.data ?? []) as MentorProfileRow[]).map((row) => [
      row.user_id,
      row,
    ])
  );

  const recipientAuthEmail = normalizeEmail(
    recipientAuthResult.data.user?.email ?? null
  );
  const recipientMentorEmail = normalizeEmail(
    mentorMap.get(input.recipientId)?.email
  );
  const recipientEmail = recipientAuthEmail ?? recipientMentorEmail;

  if (!recipientEmail) {
    console.warn(
      `Skipped message email notification because no email was found for recipient ${input.recipientId}.`
    );
    return;
  }

  const senderName = resolveDisplayName(
    input.senderId,
    userMap,
    mentorMap,
    "Someone"
  );
  const recipientName = resolveDisplayName(
    input.recipientId,
    userMap,
    mentorMap,
    "there"
  );
  const categoryLabel = formatCategory(input.category);
  const messagePreview = summarizeMessage(input.messageBody);
  const messagesUrl = getMessagesUrl();
  const email = buildMessageEmail({
    category: categoryLabel,
    messagePreview,
    messagesUrl,
    recipientName,
    senderName,
  });

  await sendTransactionalEmail({
    to: recipientEmail,
    subject: `New message from ${senderName} on Bridgeee`,
    html: email.html,
    idempotencyKey: `message-notification-${input.messageId}`,
  });
}
