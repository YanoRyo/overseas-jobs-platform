const LAST_UPDATED_AT = "2026-04-16T00:00:00.000Z";

export function formatLastUpdated(locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(LAST_UPDATED_AT));
}
