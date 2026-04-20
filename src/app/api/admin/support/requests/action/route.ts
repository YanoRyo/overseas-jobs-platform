import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { sendSupportReplyEmail } from "@/lib/email/supportRequests";
import {
  createSupportReplyRecord,
  getSupportRequestRecordById,
  markSupportRequestAsReplied,
  SupportRequestActionError,
  updateSupportReplyDelivery,
} from "@/lib/support/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RequestBody = {
  action?: "reply";
  requestId?: unknown;
  subject?: unknown;
  message?: unknown;
};

function normalizeString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function summarizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 1000);
  }

  if (typeof error === "string") {
    return error.slice(0, 1000);
  }

  return "Unknown email delivery error";
}

export async function POST(request: Request) {
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

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.action !== "reply") {
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  }

  const requestId = normalizeString(body.requestId, 100);
  const subject = normalizeString(body.subject, 160);
  const message = normalizeString(body.message, 5000);

  if (!requestId) {
    return NextResponse.json({ error: "requestId is required." }, { status: 400 });
  }

  if (!subject) {
    return NextResponse.json({ error: "subject is required." }, { status: 400 });
  }

  if (!message) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  try {
    const supportRequest = await getSupportRequestRecordById(requestId);

    if (!supportRequest) {
      throw new SupportRequestActionError("Support request not found.", 404);
    }

    const reply = await createSupportReplyRecord({
      requestId,
      senderUserId: user.id,
      subject,
      body: message,
    });

    try {
      const result = await sendSupportReplyEmail({
        category: supportRequest.category,
        context: supportRequest.request_context,
        recipientEmail: supportRequest.email,
        recipientName: supportRequest.name,
        replyId: reply.id,
        requestId,
        responseBody: message,
        subject,
      });

      if (!result.ok) {
        throw new SupportRequestActionError(
          "Transactional email is unavailable for support replies.",
          503
        );
      }

      const sentAt = new Date().toISOString();

      await updateSupportReplyDelivery({
        replyId: reply.id,
        deliveryStatus: "sent",
        deliveryError: null,
        sentAt,
      });

      await markSupportRequestAsReplied({
        requestId,
        repliedByUserId: user.id,
        repliedAt: sentAt,
      });

      return NextResponse.json({ success: true });
    } catch (replyError) {
      await updateSupportReplyDelivery({
        replyId: reply.id,
        deliveryStatus: "failed",
        deliveryError: summarizeError(replyError),
        sentAt: null,
      });

      throw replyError;
    }
  } catch (error) {
    if (error instanceof SupportRequestActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Support admin action failed:", error);
    return NextResponse.json(
      { error: "Failed to send the support reply." },
      { status: 500 }
    );
  }
}
