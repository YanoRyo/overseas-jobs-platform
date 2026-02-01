export type ConversationItem = {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatarUrl?: string;
  lastMessage: string;
  updatedAt: string;
  unread: boolean;
  unreadCount: number;
};
