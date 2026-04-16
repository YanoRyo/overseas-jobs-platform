import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "../constants";

export function getCurrencySymbol(currency: CurrencyCode): string {
  return (
    CURRENCIES.find((entry) => entry.code === currency)?.symbol ??
    CURRENCIES.find((entry) => entry.code === DEFAULT_CURRENCY)?.symbol ??
    "$"
  );
}

export function formatLocalizedPrice(
  amount: number,
  currency: CurrencyCode
): string {
  const symbol = getCurrencySymbol(currency);
  const formattedAmount = Number.isInteger(amount)
    ? amount.toLocaleString()
    : amount.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });

  return `${symbol}${formattedAmount}`;
}
