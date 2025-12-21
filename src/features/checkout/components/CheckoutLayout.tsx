"use client";
import { useCheckout } from "../hooks/useCheckout";
import { BackButton } from "./BackButton";
import { ReservationSummary } from "./ReservationSummary";
import { PaymentSection } from "./PaymentSection";

export const CheckoutLayout = () => {
  const { reservation } = useCheckout();

  if (!reservation) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10 relative">
      <div className="w-full max-w-5xl relative">
        <BackButton />

        <div className="bg-white rounded-xl shadow-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <ReservationSummary reservation={reservation} />
          <PaymentSection reservation={reservation} />
        </div>
      </div>
    </div>
  );
};
