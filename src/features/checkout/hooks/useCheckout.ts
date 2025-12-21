"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReservationData } from "../types/reservation";

export const useCheckout = () => {
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("pendingReservation");
    if (!stored) {
      alert("予約情報が見つかりませんでした。");
      router.push("/");
      return;
    }
    setReservation(JSON.parse(stored));
  }, [router]);

  return {
    reservation,
    selectedMethod,
    setSelectedMethod,
    router,
  };
};
