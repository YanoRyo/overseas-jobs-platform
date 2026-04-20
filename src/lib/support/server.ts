import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { SupportRequestCategory } from "@/features/support/constants";

export type SupportRequestStatus = "open" | "replied";
export type SupportReplyDeliveryStatus = "pending" | "sent" | "failed";

export type SupportRequestRow = {
  id: string;
  requester_user_id: string | null;
  name: string;
  email: string;
  category: SupportRequestCategory;
  request_context: string | null;
  message: string;
  locale: string | null;
  status: SupportRequestStatus;
  last_replied_at: string | null;
  last_replied_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SupportRequestReplyRow = {
  id: string;
  support_request_id: string;
  sender_user_id: string | null;
  subject: string;
  body: string;
  delivery_status: SupportReplyDeliveryStatus;
  delivery_error: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

type CreateSupportRequestInput = {
  category: SupportRequestCategory;
  context: string | null;
  email: string;
  locale: string | null;
  message: string;
  name: string;
  userId: string | null;
};

type ReplyToSupportRequestInput = {
  deliveryError?: string | null;
  deliveryStatus: SupportReplyDeliveryStatus;
  replyId: string;
  sentAt?: string | null;
};

export class SupportRequestActionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "SupportRequestActionError";
    this.statusCode = statusCode;
  }
}

export async function createSupportRequestRecord(
  input: CreateSupportRequestInput
) {
  const adminDb = createSupabaseServiceClient();
  const { data, error } = await adminDb
    .from("support_requests")
    .insert({
      requester_user_id: input.userId,
      name: input.name,
      email: input.email,
      category: input.category,
      request_context: input.context,
      message: input.message,
      locale: input.locale,
    })
    .select(
      "id, requester_user_id, name, email, category, request_context, message, locale, status, last_replied_at, last_replied_by, created_at, updated_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return data as SupportRequestRow;
}

export async function getSupportRequestRecordById(requestId: string) {
  const adminDb = createSupabaseServiceClient();
  const { data, error } = await adminDb
    .from("support_requests")
    .select(
      "id, requester_user_id, name, email, category, request_context, message, locale, status, last_replied_at, last_replied_by, created_at, updated_at"
    )
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as SupportRequestRow | null) ?? null;
}

export async function createSupportReplyRecord(params: {
  requestId: string;
  senderUserId: string;
  subject: string;
  body: string;
}) {
  const adminDb = createSupabaseServiceClient();
  const { data, error } = await adminDb
    .from("support_request_replies")
    .insert({
      support_request_id: params.requestId,
      sender_user_id: params.senderUserId,
      subject: params.subject,
      body: params.body,
    })
    .select(
      "id, support_request_id, sender_user_id, subject, body, delivery_status, delivery_error, sent_at, created_at, updated_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return data as SupportRequestReplyRow;
}

export async function updateSupportReplyDelivery(params: ReplyToSupportRequestInput) {
  const adminDb = createSupabaseServiceClient();
  const { error } = await adminDb
    .from("support_request_replies")
    .update({
      delivery_status: params.deliveryStatus,
      delivery_error: params.deliveryError ?? null,
      sent_at: params.sentAt ?? null,
    })
    .eq("id", params.replyId);

  if (error) {
    throw error;
  }
}

export async function markSupportRequestAsReplied(params: {
  requestId: string;
  repliedByUserId: string;
  repliedAt: string;
}) {
  const adminDb = createSupabaseServiceClient();
  const { error } = await adminDb
    .from("support_requests")
    .update({
      status: "replied",
      last_replied_at: params.repliedAt,
      last_replied_by: params.repliedByUserId,
    })
    .eq("id", params.requestId);

  if (error) {
    throw error;
  }
}

export async function listSupportRequestsForAdmin() {
  const adminDb = createSupabaseServiceClient();
  const [requestsResult, repliesResult] = await Promise.all([
    adminDb
      .from("support_requests")
      .select(
        "id, requester_user_id, name, email, category, request_context, message, locale, status, last_replied_at, last_replied_by, created_at, updated_at"
      )
      .order("created_at", { ascending: false }),
    adminDb
      .from("support_request_replies")
      .select(
        "id, support_request_id, sender_user_id, subject, body, delivery_status, delivery_error, sent_at, created_at, updated_at"
      )
      .order("created_at", { ascending: true }),
  ]);

  if (requestsResult.error) {
    throw requestsResult.error;
  }

  if (repliesResult.error) {
    throw repliesResult.error;
  }

  const requests = (requestsResult.data ?? []) as SupportRequestRow[];
  const replies = (repliesResult.data ?? []) as SupportRequestReplyRow[];

  return {
    requests,
    replies,
  };
}
