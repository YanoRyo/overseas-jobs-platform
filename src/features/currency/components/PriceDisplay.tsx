"use client";

import { useCurrency } from "../context/CurrencyContext";
import { useExchangeRates } from "../hooks/useExchangeRate";
import { CURRENCIES } from "../constants";

type Props = {
  amountUSD: number;
  className?: string;
};

function formatCurrency(amount: number, currencyCode: string): string {
  const info = CURRENCIES.find((c) => c.code === currencyCode);
  const symbol = info?.symbol ?? "$";

  if (currencyCode === "JPY") {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  return `${symbol}${amount.toFixed(2)}`;
}

export function PriceDisplay({ amountUSD, className }: Props) {
  const { currency } = useCurrency();
  const { convertFromUSD, loading } = useExchangeRates();

  if (currency === "USD") {
    return <span className={className}>${amountUSD.toFixed(2)}</span>;
  }

  const converted = convertFromUSD(amountUSD, currency);

  if (loading || converted === null) {
    return <span className={className}>${amountUSD.toFixed(2)}</span>;
  }

  return (
    <span className={className}>
      {formatCurrency(converted, currency)}
      <span className="ml-1 text-xs text-gray-400">
        (≈ ${amountUSD.toFixed(2)})
      </span>
    </span>
  );
}
