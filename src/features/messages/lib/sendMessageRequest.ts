import type { Message } from "../types/message";

type SendMessageRequestInput = {
  category?: string | null;
  conversationId?: string;
  mentorId?: string;
  message: string;
};

type SendMessageResponse = {
  conversationId: string;
  message: Message;
};

export async function sendMessageRequest(
  input: SendMessageRequestInput
): Promise<SendMessageResponse> {
  const response = await fetch("/api/messages/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = (await response
    .json()
    .catch(() => null)) as
    | {
        conversationId?: string;
        error?: string;
        message?: Message;
      }
    | null;

  if (!response.ok || !data?.conversationId || !data.message) {
    throw new Error(data?.error ?? "送信に失敗しました");
  }

  return {
    conversationId: data.conversationId,
    message: data.message,
  };
}
