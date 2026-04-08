import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { sendNewMessageNotificationEmail } from "@/lib/email/messageNotifications";

type SendMessageBody = {
  category?: unknown;
  conversationId?: unknown;
  mentorId?: unknown;
  message?: unknown;
};

type ConversationRow = {
  id: string;
  mentor_id: string;
  student_id: string;
};

type MessageRow = {
  body: string;
  category: string | null;
  conversation_id: string;
  created_at: string;
  id: number;
  sender_id: string;
};

function normalizeString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function resolveConversationForSend({
  adminDb,
  conversationId,
  mentorId,
  userId,
}: {
  adminDb: ReturnType<typeof createSupabaseServiceClient>;
  conversationId: string | null;
  mentorId: string | null;
  userId: string;
}) {
  if (conversationId) {
    const { data: conversation, error } = await adminDb
      .from("conversation")
      .select("id, mentor_id, student_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const row = conversation as ConversationRow | null;
    if (!row) {
      return null;
    }

    if (row.mentor_id !== userId && row.student_id !== userId) {
      return { unauthorized: true as const };
    }

    return {
      conversationId: row.id,
      recipientId: row.mentor_id === userId ? row.student_id : row.mentor_id,
    };
  }

  if (!mentorId) {
    return null;
  }

  if (mentorId === userId) {
    return { invalidRecipient: true as const };
  }

  const { data: mentor, error: mentorError } = await adminDb
    .from("mentors")
    .select("user_id")
    .eq("user_id", mentorId)
    .maybeSingle();

  if (mentorError) {
    throw mentorError;
  }

  if (!mentor) {
    return null;
  }

  const { data: existingConversation, error: findError } = await adminDb
    .from("conversation")
    .select("id")
    .eq("mentor_id", mentorId)
    .eq("student_id", userId)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  let nextConversationId = existingConversation?.id ?? null;

  if (!nextConversationId) {
    const { data: createdConversation, error: createError } = await adminDb
      .from("conversation")
      .insert({
        mentor_id: mentorId,
        student_id: userId,
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (createError) {
      throw createError;
    }

    nextConversationId = createdConversation.id;
  }

  return {
    conversationId: nextConversationId,
    recipientId: mentorId,
  };
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("messages/send auth error", userError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SendMessageBody;
  try {
    body = (await request.json()) as SendMessageBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const message = normalizeString(body.message);
  const category = normalizeString(body.category) ?? null;
  const conversationId = normalizeString(body.conversationId);
  const mentorId = normalizeString(body.mentorId);

  if (!message) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  if (!conversationId && !mentorId) {
    return NextResponse.json(
      { error: "Conversation or mentor is required" },
      { status: 400 }
    );
  }

  const adminDb = createSupabaseServiceClient();

  try {
    const conversation = await resolveConversationForSend({
      adminDb,
      conversationId,
      mentorId,
      userId: user.id,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if ("unauthorized" in conversation) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if ("invalidRecipient" in conversation) {
      return NextResponse.json(
        { error: "Invalid recipient" },
        { status: 400 }
      );
    }

    const sentAt = new Date().toISOString();
    const { data: insertedMessage, error: messageError } = await adminDb
      .from("message")
      .insert({
        conversation_id: conversation.conversationId,
        sender_id: user.id,
        body: message,
        category,
      })
      .select("id, conversation_id, sender_id, body, category, created_at")
      .single();

    if (messageError) {
      throw messageError;
    }

    const { error: updateError } = await adminDb
      .from("conversation")
      .update({ last_message_at: sentAt })
      .eq("id", conversation.conversationId);

    if (updateError) {
      throw updateError;
    }

    const { error: unreadError } = await adminDb.rpc(
      "mark_conversation_as_unread",
      {
        p_conversation_id: conversation.conversationId,
        p_receiver_id: conversation.recipientId,
      }
    );

    if (unreadError) {
      console.error("messages/send unread update error", unreadError);
    }

    const messageRow = insertedMessage as MessageRow;

    try {
      await sendNewMessageNotificationEmail({
        category: messageRow.category,
        messageBody: messageRow.body,
        messageId: messageRow.id,
        recipientId: conversation.recipientId,
        senderId: user.id,
      });
    } catch (notificationError) {
      console.error(
        "messages/send email notification error",
        notificationError
      );
    }

    return NextResponse.json({
      conversationId: conversation.conversationId,
      message: messageRow,
    });
  } catch (error) {
    console.error("messages/send error", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
