import "server-only";

type EmailTag = {
  name: string;
  value: string;
};

type SendTransactionalEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  tags?: EmailTag[];
};

type ResendSendResponse = {
  id?: string;
  message?: string;
  error?: {
    message?: string;
  };
};

let hasWarnedForMissingEmailConfig = false;

export function isTransactionalEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (!hasWarnedForMissingEmailConfig) {
      console.warn(
        "Transactional email is disabled because RESEND_API_KEY or EMAIL_FROM is missing."
      );
      hasWarnedForMissingEmailConfig = true;
    }
    return null;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
      "User-Agent": "bridgeee/1.0",
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      tags: input.tags,
    }),
  });

  const body = (await response
    .json()
    .catch(() => null)) as ResendSendResponse | null;

  if (!response.ok) {
    const detail =
      body?.message ?? body?.error?.message ?? "Unknown Resend error";
    throw new Error(`Resend send failed: ${response.status} ${detail}`);
  }

  if (!body?.id) {
    throw new Error("Resend send response did not include an email id");
  }

  return { id: body.id };
}
