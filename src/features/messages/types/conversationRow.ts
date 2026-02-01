export type ConversationRow = {
  id: string;
  mentor_id: string;
  student_id: string;
  last_message_at: string | null;

  unread_by?: string[];

  message?: {
    body: string;
    created_at: string;
  }[];

  mentor?: {
    id: string;
    name: string | null;
  }[];

  student?: {
    id: string;
    name: string | null;
  }[];
};
