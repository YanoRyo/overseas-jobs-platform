import { NextResponse } from "next/server";
import {
  SUPPORT_REQUEST_CONTEXT_MAX_LENGTH,
  SUPPORT_REQUEST_EMAIL_MAX_LENGTH,
  SUPPORT_REQUEST_MESSAGE_MAX_LENGTH,
  SUPPORT_REQUEST_NAME_MAX_LENGTH,
  isSupportRequestCategory,
} from "@/features/support/constants";
import { sendSupportRequestNotification } from "@/lib/email/supportRequests";
import { createSupportRequestRecord } from "@/lib/support/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupportRequestBody = {
  category?: unknown;
  company?: unknown;
  context?: unknown;
  email?: unknown;
  locale?: unknown;
  message?: unknown;
  name?: unknown;
};

function normalizeString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

function normalizeOptionalString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function isValidEmailAddress(value: string) {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

async function resolveSignedInUserId() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("support/requests auth lookup error", error);
      return null;
    }

    return user?.id ?? null;
  } catch (error) {
    console.error("support/requests auth bootstrap error", error);
    return null;
  }
}

export async function POST(request: Request) {
  let body: SupportRequestBody;

  try {
    body = (await request.json()) as SupportRequestBody;
  } catch {
    return NextResponse.json({ errorCode: "invalid_body" }, { status: 400 });
  }

  const honeypot = normalizeOptionalString(body.company, 200);

  if (honeypot) {
    return NextResponse.json({ success: true });
  }

  const name = normalizeString(body.name, SUPPORT_REQUEST_NAME_MAX_LENGTH);
  if (!name) {
    return NextResponse.json({ errorCode: "invalid_name" }, { status: 400 });
  }

  const email = normalizeString(body.email, SUPPORT_REQUEST_EMAIL_MAX_LENGTH);
  if (!email || !isValidEmailAddress(email)) {
    return NextResponse.json({ errorCode: "invalid_email" }, { status: 400 });
  }

  const category =
    typeof body.category === "string" && isSupportRequestCategory(body.category)
      ? body.category
      : null;

  if (!category) {
    return NextResponse.json(
      { errorCode: "invalid_category" },
      { status: 400 }
    );
  }

  const message = normalizeString(body.message, SUPPORT_REQUEST_MESSAGE_MAX_LENGTH);
  if (!message) {
    return NextResponse.json(
      { errorCode: "invalid_message" },
      { status: 400 }
    );
  }

  const context = normalizeOptionalString(
    body.context,
    SUPPORT_REQUEST_CONTEXT_MAX_LENGTH
  );
  const locale = normalizeOptionalString(body.locale, 12);
  const userId = await resolveSignedInUserId();

  try {
    const supportRequest = await createSupportRequestRecord({
      category,
      context,
      email,
      locale,
      message,
      name,
      userId,
    });

    try {
      const result = await sendSupportRequestNotification({
        requestId: supportRequest.id,
        category,
        context,
        email,
        locale,
        message,
        name,
        userId,
      });

      if (!result.ok) {
        console.warn("Support request saved without email notification.", {
          reason: result.reason,
          requestId: supportRequest.id,
        });
      }
    } catch (notificationError) {
      console.error(
        "support/requests notification send error",
        notificationError
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("support/requests send error", error);
    return NextResponse.json({ errorCode: "submit_failed" }, { status: 500 });
  }
}
