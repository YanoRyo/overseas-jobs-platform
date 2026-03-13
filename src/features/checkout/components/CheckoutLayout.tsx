"use client";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/client";
import { useCheckout } from "../hooks/useCheckout";
import { BackButton } from "./BackButton";
import { ReservationSummary } from "./ReservationSummary";
import { PaymentSection } from "./PaymentSection";

export const CheckoutLayout = () => {
  const { reservation, clientSecret, paymentError, loadingPayment } =
    useCheckout();

  if (!reservation) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10 relative">
      <div className="w-full max-w-5xl relative">
        <BackButton />

        <div className="bg-white rounded-xl shadow-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <ReservationSummary reservation={reservation} />

          {loadingPayment ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">
                お支払い方法
              </h2>
              <div className="h-[200px] animate-pulse rounded-[10px] bg-gray-100" />
            </div>
          ) : paymentError ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">
                お支払い方法
              </h2>
              <p className="text-sm text-[#c32a68]">{paymentError}</p>
            </div>
          ) : clientSecret ? (
            <Elements
              stripe={getStripe()}
              options={{ clientSecret }}
            >
              <PaymentSection reservation={reservation} />
            </Elements>
          ) : null}
        </div>
      </div>
    </div>
  );
};
