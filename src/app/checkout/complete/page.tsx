"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { getStripe } from "@/lib/stripe/client";

type PaymentResult = {
  status: "succeeded" | "processing" | "failed";
  message: string;
};

function CheckoutCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<PaymentResult | null>(null);

  useEffect(() => {
    const clientSecret = searchParams.get("payment_intent_client_secret");
    if (!clientSecret) {
      setResult({ status: "failed", message: "Payment details were not found." });
      return;
    }

    const checkPayment = async () => {
      const stripe = await getStripe();
      if (!stripe) {
        setResult({
          status: "failed",
          message: "Failed to initialize the payment system.",
        });
        return;
      }

      const { paymentIntent } = await stripe.retrievePaymentIntent(
        clientSecret
      );

      switch (paymentIntent?.status) {
        case "succeeded":
          setResult({ status: "succeeded", message: "Payment completed." });
          localStorage.removeItem("pendingReservation");
          break;
        case "processing":
          setResult({
            status: "processing",
            message: "Your payment is processing. Please wait a moment.",
          });
          break;
        default:
          setResult({
            status: "failed",
            message: "Payment failed. Please try again.",
          });
          break;
      }
    };

    checkPayment();
  }, [searchParams]);

  if (!result) {
    return (
      <div className="page-shell page-stack min-h-screen">
        <div className="glass-panel flex min-h-[60vh] items-center justify-center rounded-[34px]">
          <p className="text-sm text-secondary">Checking payment status...</p>
        </div>
      </div>
    );
  }

  const isSuccess = result.status === "succeeded" || result.status === "processing";

  return (
    <div className="page-shell page-stack min-h-screen">
      <div className="glass-shell mx-auto w-full max-w-md rounded-[34px] px-6 py-10 text-center">
        {isSuccess ? (
          <div className="glass-panel mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
        ) : (
          <div className="glass-panel mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#c32a68]/10">
            <XCircle className="h-8 w-8 text-[#c32a68]" />
          </div>
        )}

        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-primary">
          {result.message}
        </h1>

        {isSuccess && (
          <div className="glass-panel mt-6 rounded-[24px] p-4">
            <p className="text-sm text-secondary">
              Your meeting link will be issued after payment confirmation and will be available in My Lessons.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-3">
          {isSuccess ? (
            <>
              <button
                onClick={() => router.push("/settings?tab=my-lessons")}
                className="glass-button-primary w-full justify-center rounded-[22px] px-4 py-3.5 text-sm"
              >
                Go to My Lessons
              </button>
              <button
                onClick={() => router.push("/")}
                className="glass-button w-full justify-center rounded-[22px] px-4 py-3.5 text-sm"
              >
                Back to Home
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/checkout")}
                className="glass-button-primary w-full justify-center rounded-[22px] px-4 py-3.5 text-sm"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/")}
                className="glass-button w-full justify-center rounded-[22px] px-4 py-3.5 text-sm"
              >
                Back to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell page-stack min-h-screen">
          <div className="glass-panel flex min-h-[60vh] items-center justify-center rounded-[34px]">
            <p className="text-sm text-secondary">Loading...</p>
          </div>
        </div>
      }
    >
      <CheckoutCompleteContent />
    </Suspense>
  );
}
