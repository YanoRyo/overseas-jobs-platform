"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { ShieldCheck } from "lucide-react";
import ReviewCarousel from "@/components/ReviewCarousel";
import { ReservationData } from "../types/reservation";

export const PaymentSection = ({
  reservation,
}: {
  reservation: ReservationData;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 表示用の金額を算出（セント → ドル）
  // サーバー側のcalculateLessonFeeと同じ計算ロジック: Math.ceil((hourlyRate * duration) / 60)
  const amountCents = Math.ceil(
    (reservation.hourlyRate * reservation.duration) / 60
  );
  const displayAmount = (amountCents / 100).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/complete`,
      },
    });

    // confirmPaymentはリダイレクトするので、ここに到達するのはエラー時のみ
    if (confirmError) {
      setError(confirmError.message ?? "決済に失敗しました");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold border-b pb-2">お支払い方法</h2>

      <div className="rounded-[10px] border border-[#cfd3e1] bg-white p-4">
        <PaymentElement />
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-[#2563eb]/20 bg-[#2563eb]/5 p-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#2563eb]" />
        <div>
          <p className="text-sm font-medium text-[#1f1f2d]">
            安心のエスクロー決済
          </p>
          <p className="text-xs text-[#606579]">
            レッスン完了まで代金は安全に保管されます
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-[#c32a68]">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="h-11 w-full rounded-[10px] border-2 border-[#1d4ed8] bg-[#2563eb] text-lg font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
      >
        {processing ? "処理中..." : `$${displayAmount} を支払う`}
      </button>

      <ReviewCarousel />
    </form>
  );
};
