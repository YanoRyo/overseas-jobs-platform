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
  name?: string;
  error?: {
    message?: string;
  };
};

type ResendPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
  tags?: EmailTag[];
};

type ResendAttemptResult = {
  body: ResendSendResponse | null;
  response: Response;
};

let hasWarnedForMissingEmailConfig = false;
let hasWarnedForInvalidEmailFrom = false;

function isValidEmailAddress(value: string) {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

function stripWrappingQuotes(value: string) {
  const trimmed = value.trim();
  const quotePairs: Array<[string, string]> = [
    ['"', '"'],
    ["'", "'"],
    ["“", "”"],
    ["‘", "’"],
  ];

  for (const [start, end] of quotePairs) {
    if (trimmed.startsWith(start) && trimmed.endsWith(end)) {
      return trimmed.slice(start.length, trimmed.length - end.length).trim();
    }
  }

  return trimmed;
}

function normalizeEmailFrom(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = stripWrappingQuotes(trimmed);

  if (isValidEmailAddress(normalized)) {
    return normalized;
  }

  const namedSenderMatch = normalized.match(/^(.*?)<([^<>]+)>$/);
  if (!namedSenderMatch) {
    return null;
  }

  const displayName = stripWrappingQuotes(namedSenderMatch[1] ?? "");
  const emailAddress = namedSenderMatch[2]?.trim();

  if (!displayName || !emailAddress || !isValidEmailAddress(emailAddress)) {
    return null;
  }

  return `${displayName} <${emailAddress}>`;
}

function warnForInvalidEmailFrom(value?: string | null) {
  if (hasWarnedForInvalidEmailFrom) {
    return;
  }

  hasWarnedForInvalidEmailFrom = true;
  console.warn(
    "Transactional email is disabled because EMAIL_FROM is invalid. Use `email@example.com` or `Name <email@example.com>`.",
    value ? { emailFromPreview: value } : undefined
  );
}

export function isTransactionalEmailConfigured() {
  const apiKey = process.env.RESEND_API_KEY;
  const normalizedFrom = normalizeEmailFrom(process.env.EMAIL_FROM);

  if (!apiKey || !process.env.EMAIL_FROM) {
    return false;
  }

  if (!normalizedFrom) {
    warnForInvalidEmailFrom(process.env.EMAIL_FROM);
    return false;
  }

  return true;
}

function buildResendPayload(
  input: SendTransactionalEmailInput,
  from: string,
  options?: {
    includeTags?: boolean;
    includeText?: boolean;
  }
): ResendPayload {
  const includeTags = options?.includeTags ?? true;
  const includeText = options?.includeText ?? true;

  return {
    from,
    to: (Array.isArray(input.to) ? input.to : [input.to]).map((value) =>
      stripWrappingQuotes(value.trim())
    ),
    subject: input.subject,
    html: input.html,
    text: includeText ? input.text : undefined,
    tags: includeTags ? input.tags : undefined,
  };
}

async function sendResendRequest(
  apiKey: string,
  input: SendTransactionalEmailInput,
  payload: ResendPayload
): Promise<ResendAttemptResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
      "User-Agent": "bridgeee/1.0",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response
    .json()
    .catch(() => null)) as ResendSendResponse | null;

  return { response, body };
}

function formatResendErrorMessage(
  status: number,
  body: ResendSendResponse | null
) {
  const detail = body?.message ?? body?.error?.message ?? "Unknown Resend error";
  return `Resend send failed: ${status} ${detail}`;
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput
) {
  const apiKey = process.env.RESEND_API_KEY;
  const rawFrom = process.env.EMAIL_FROM;
  const normalizedFrom = normalizeEmailFrom(rawFrom);

  if (!apiKey || !rawFrom) {
    if (!hasWarnedForMissingEmailConfig) {
      console.warn(
        "Transactional email is disabled because RESEND_API_KEY or EMAIL_FROM is missing."
      );
      hasWarnedForMissingEmailConfig = true;
    }
    return null;
  }

  if (!normalizedFrom) {
    warnForInvalidEmailFrom(rawFrom);
    return null;
  }

  const fullPayload = buildResendPayload(input, normalizedFrom);
  let { response, body } = await sendResendRequest(apiKey, input, fullPayload);

  if (!response.ok && response.status === 422) {
    const fallbackPayload = buildResendPayload(input, normalizedFrom, {
      includeTags: false,
      includeText: false,
    });

    console.warn(
      "Retrying transactional email with a minimal Resend payload after a 422 validation error.",
      {
        initialError: body?.message ?? body?.error?.message ?? null,
        from: fullPayload.from,
        recipientCount: fullPayload.to.length,
        tagNames: fullPayload.tags?.map((tag) => tag.name) ?? [],
        hadTextBody: Boolean(fullPayload.text),
      }
    );

    ({ response, body } = await sendResendRequest(apiKey, input, fallbackPayload));
  }

  if (!response.ok) {
    throw new Error(formatResendErrorMessage(response.status, body));
  }

  if (!body?.id) {
    throw new Error("Resend send response did not include an email id");
  }

  return { id: body.id };
}
