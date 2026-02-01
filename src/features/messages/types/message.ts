export type Message = {
  id: number;
  conversation_id: string;
  sender_id: string;
  body: string;
  category: string | null;
  created_at: string;
  // UI用（DBには無い）
  client_id?: string; // 仮メッセージ識別用
  status?: "pending" | "sent" | "failed";
};
