export const SUPPORT_REQUEST_CATEGORY_VALUES = [
  "payment",
  "schedule_change",
  "no_response",
  "trouble_report",
  "other",
] as const;

export type SupportRequestCategory =
  (typeof SUPPORT_REQUEST_CATEGORY_VALUES)[number];

export const SUPPORT_REQUEST_NAME_MAX_LENGTH = 80;
export const SUPPORT_REQUEST_EMAIL_MAX_LENGTH = 254;
export const SUPPORT_REQUEST_CONTEXT_MAX_LENGTH = 120;
export const SUPPORT_REQUEST_MESSAGE_MAX_LENGTH = 3000;

export function isSupportRequestCategory(
  value: string
): value is SupportRequestCategory {
  return (SUPPORT_REQUEST_CATEGORY_VALUES as readonly string[]).includes(value);
}
