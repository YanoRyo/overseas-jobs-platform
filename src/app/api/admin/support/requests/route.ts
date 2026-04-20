import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import {
  listSupportRequestsForAdmin,
  type SupportRequestReplyRow,
  type SupportRequestRow,
} from "@/lib/support/server";
import type {
  AdminSupportReply,
  AdminSupportRequest,
  AdminSupportRequestsResponse,
} from "@/features/admin/types";

type UserRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
};

function buildDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string | null
) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || fallback || "Unknown";
}

function buildSupportSearchOrder(left: AdminSupportRequest, right: AdminSupportRequest) {
  const leftRank = left.status === "open" ? 0 : 1;
  const rightRank = right.status === "open" ? 0 : 1;

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  const leftTimestamp = new Date(
    left.lastRepliedAt ?? left.createdAt
  ).getTime();
  const rightTimestamp = new Date(
    right.lastRepliedAt ?? right.createdAt
  ).getTime();

  return rightTimestamp - leftTimestamp;
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

  try {
    const adminDb = createSupabaseServiceClient();
    const { requests, replies } = await listSupportRequestsForAdmin();

    const userIds = [
      ...new Set(
        [
          ...requests.flatMap((request) => [
            request.requester_user_id,
            request.last_replied_by,
          ]),
          ...replies.map((reply) => reply.sender_user_id),
        ].filter((value): value is string => Boolean(value))
      ),
    ];

    const userMap = new Map<string, UserRow>();

    if (userIds.length > 0) {
      const usersResult = await adminDb
        .from("users")
        .select("id, username, first_name, last_name")
        .in("id", userIds);

      if (usersResult.error) {
        throw usersResult.error;
      }

      ((usersResult.data ?? []) as UserRow[]).forEach((row) => {
        userMap.set(row.id, row);
      });
    }

    const repliesByRequestId = new Map<string, AdminSupportReply[]>();

    for (const reply of replies as SupportRequestReplyRow[]) {
      const sender = reply.sender_user_id
        ? userMap.get(reply.sender_user_id) ?? null
        : null;

      const mappedReply: AdminSupportReply = {
        id: reply.id,
        supportRequestId: reply.support_request_id,
        senderUserId: reply.sender_user_id,
        senderDisplayName: buildDisplayName(
          sender?.first_name,
          sender?.last_name,
          sender?.username ?? "Admin"
        ),
        subject: reply.subject,
        body: reply.body,
        deliveryStatus: reply.delivery_status,
        deliveryError: reply.delivery_error,
        sentAt: reply.sent_at,
        createdAt: reply.created_at,
      };

      const current = repliesByRequestId.get(reply.support_request_id) ?? [];
      current.push(mappedReply);
      repliesByRequestId.set(reply.support_request_id, current);
    }

    const mappedRequests = (requests as SupportRequestRow[])
      .map((request): AdminSupportRequest => {
        const lastRepliedBy = request.last_replied_by
          ? userMap.get(request.last_replied_by) ?? null
          : null;

        return {
          id: request.id,
          requesterUserId: request.requester_user_id,
          name: request.name,
          email: request.email,
          category: request.category,
          context: request.request_context,
          message: request.message,
          locale: request.locale,
          status: request.status,
          createdAt: request.created_at,
          updatedAt: request.updated_at,
          lastRepliedAt: request.last_replied_at,
          lastRepliedByUserId: request.last_replied_by,
          lastRepliedByDisplayName: lastRepliedBy
            ? buildDisplayName(
                lastRepliedBy.first_name,
                lastRepliedBy.last_name,
                lastRepliedBy.username
              )
            : null,
          replies: repliesByRequestId.get(request.id) ?? [],
        };
      })
      .sort(buildSupportSearchOrder);

    const response: AdminSupportRequestsResponse = {
      updatedAt: new Date().toISOString(),
      summary: {
        total: mappedRequests.length,
        open: mappedRequests.filter((request) => request.status === "open")
          .length,
        replied: mappedRequests.filter((request) => request.status === "replied")
          .length,
        failedReplies: mappedRequests.reduce(
          (count, request) =>
            count +
            request.replies.filter((reply) => reply.deliveryStatus === "failed")
              .length,
          0
        ),
      },
      requests: mappedRequests,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Admin support requests fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch support requests" },
      { status: 500 }
    );
  }
}
