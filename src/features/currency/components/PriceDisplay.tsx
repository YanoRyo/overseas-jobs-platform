"use client";

import { useCurrency } from "../context/CurrencyContext";
import { CURRENCIES } from "../constants";

type Props = {
  amountUSD: number;
  className?: string;
  /** USD参考価格を表示するか（default: true） */
  showHelper?: boolean;
};

function formatCurrency(amount: number, currencyCode: string): string {
  const info = CURRENCIES.find((c) => c.code === currencyCode);
  const symbol = info?.symbol ?? "$";

  if (currencyCode === "JPY") {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  return `${symbol}${amount.toFixed(2)}`;
}

export function PriceDisplay({
  amountUSD,
  className,
  showHelper = true,
}: Props) {
  const { currency, convertFromUSD, ratesLoading } = useCurrency();

  if (currency === "USD") {
    return <span className={className}>${amountUSD.toFixed(2)}</span>;
  }

  const converted = convertFromUSD(amountUSD, currency);

  if (ratesLoading || converted === null) {
    return <span className={className}>${amountUSD.toFixed(2)}</span>;
  }

  return (
    <span className={className}>
      {formatCurrency(converted, currency)}
      {showHelper && (
        <span className="ml-1 text-xs font-normal text-gray-400">
          (≈ ${amountUSD.toFixed(2)})
        </span>
      )}
    </span>
  );
}
