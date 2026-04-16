"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

export const PaymentSection = ({
  amountCents,
}: {
  amountCents: number | null;
}) => {
  const t = useTranslations("checkout");
  const tp = useTranslations("payment");
  const locale = useLocale();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // サーバーから返された金額を表示（Single Source of Truth）
  const displayAmount = amountCents != null ? (amountCents / 100).toFixed(2) : "---";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/checkout/complete`,
      },
    });

    // confirmPaymentはリダイレクトするので、ここに到達するのはエラー時のみ
    if (confirmError) {
      setError(confirmError.message ?? t("paymentFailed"));
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold border-b pb-2">{t("paymentMethod")}</h2>

      <div className="rounded-[10px] border border-[#cfd3e1] bg-white p-4">
        <PaymentElement />
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-[#2563eb]/20 bg-[#2563eb]/5 p-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#2563eb]" />
        <div>
          <p className="text-sm font-medium text-[#1f1f2d]">{t("secureEscrow")}</p>
          <p className="text-xs text-[#606579]">
            {t("escrowDescription")}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-[#c32a68]">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="h-11 w-full rounded-[10px] border-2 border-[#1d4ed8] bg-[#2563eb] text-lg font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
      >
        {processing ? t("processing") : t("pay", { amount: displayAmount })}
      </button>

      <p className="text-center text-xs leading-5 text-secondary">
        <Link
          href="/cancellation-policy"
          className="font-medium text-accent underline-offset-2 hover:underline"
        >
          {tp("agreeCancellation")}
        </Link>
      </p>
    </form>
  );
};
