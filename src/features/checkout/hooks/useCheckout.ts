"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReservationData } from "../types/reservation";

export const useCheckout = () => {
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("pendingReservation");
    if (!stored) {
      alert("予約情報が見つかりませんでした。");
      router.push("/");
      return;
    }
    let parsed: ReservationData;
    try {
      parsed = JSON.parse(stored) as ReservationData;
    } catch {
      localStorage.removeItem("pendingReservation");
      alert("予約情報が破損しています。もう一度予約してください。");
      router.push("/");
      return;
    }
    if (!parsed.bookingId || !parsed.mentorId) {
      localStorage.removeItem("pendingReservation");
      alert("予約情報が不正です。もう一度予約してください。");
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
          setPaymentError(data.error || "決済の初期化に失敗しました");
          return;
        }
        setClientSecret(data.clientSecret);
      } catch {
        setPaymentError("決済の初期化に失敗しました");
      } finally {
        setLoadingPayment(false);
      }
    };

    createPaymentIntent();
  }, [router]);

  return {
    reservation,
    clientSecret,
    paymentError,
    loadingPayment,
    router,
  };
};
