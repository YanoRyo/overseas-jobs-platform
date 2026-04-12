export const CURRENCIES = [
  { code: "JPY", symbol: "¥", label: "JPY (¥)" },
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";
export const STORAGE_KEY = "bridgee-currency";
