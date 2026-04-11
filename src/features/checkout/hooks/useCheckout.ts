"use client";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { ReservationData } from "../types/reservation";

export const useCheckout = () => {
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState<number | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("pendingReservation");
    if (!stored) {
      alert("Booking information was not found.");
      router.push("/");
      return;
    }
    let parsed: ReservationData;
    try {
      parsed = JSON.parse(stored) as ReservationData;
    } catch {
      localStorage.removeItem("pendingReservation");
      alert("Booking information is corrupted. Please book again.");
      router.push("/");
      return;
    }
    if (!parsed.bookingId || !parsed.mentorId) {
      localStorage.removeItem("pendingReservation");
      alert("Booking information is invalid. Please book again.");
      router.push("/");
      return;
    }
    setReservation(parsed);

    // PaymentIntent作成
    const createPaymentIntent = async () => {
      setLoadingPayment(true);
      setPaymentError(null);
      try {
        const res = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: parsed.bookingId }),
        });
        const data = await res.json();
        if (!res.ok) {
          // 期限切れ等で無効な予約の場合、localStorageをクリーンアップ
          localStorage.removeItem("pendingReservation");
          setPaymentError(data.error || "Failed to initialize payment.");
          return;
        }
        // 既に決済済みの場合は完了ページへリダイレクト
        if (data.alreadyPaid) {
          localStorage.removeItem("pendingReservation");
          router.push(
            `/checkout/complete?payment_intent_client_secret=${data.clientSecret}&redirect_status=succeeded`
          );
          return;
        }
        setClientSecret(data.clientSecret);
        setAmountCents(data.amount);
      } catch {
        setPaymentError("Failed to initialize payment.");
      } finally {
        setLoadingPayment(false);
      }
    };

    createPaymentIntent();
  }, [router]);

  return {
    reservation,
    clientSecret,
    amountCents,
    paymentError,
    loadingPayment,
    router,
  };
};
