import { ConversationItem } from "../types/conversationItem";
import type { ConversationRow } from "../types/conversationRow";

export const mapConversationRowToListItem = (
  row: ConversationRow,
  currentUserId: string
): ConversationItem => {
  const partnerId =
    row.mentor_id === currentUserId ? row.student_id : row.mentor_id;
  const isUnread = row.unread_by?.includes(currentUserId) ?? false;

  return {
    id: row.id,
    partnerId,
    partnerName: "Loading...",
    partnerAvatarUrl: undefined,
    lastMessage: row.message?.[0]?.body ?? "",
    updatedAt: formatConversationDate(row.message?.[0]?.created_at),
    unread: isUnread,
    unreadCount: 0,
  };
};
export const formatConversationDate = (iso?: string) => {
  if (!iso) return "";

  const date = new Date(iso);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
};
