"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { getStripe } from "@/lib/stripe/client";

type PaymentResult = {
  status: "succeeded" | "processing" | "failed";
  message: string;
};

function CheckoutCompleteContent() {
  const t = useTranslations("checkout.complete");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<PaymentResult | null>(null);

  useEffect(() => {
    const clientSecret = searchParams.get("payment_intent_client_secret");
    if (!clientSecret) {
      setResult({ status: "failed", message: t("notFound") });
      return;
    }

    const checkPayment = async () => {
      const stripe = await getStripe();
      if (!stripe) {
        setResult({
          status: "failed",
          message: t("initFailed"),
        });
        return;
      }

      const { paymentIntent } = await stripe.retrievePaymentIntent(
        clientSecret
      );

      switch (paymentIntent?.status) {
        case "succeeded":
          setResult({ status: "succeeded", message: t("success") });
          localStorage.removeItem("pendingReservation");
          break;
        case "processing":
          setResult({
            status: "processing",
            message: t("processing"),
          });
          break;
        default:
          setResult({
            status: "failed",
            message: t("failed"),
          });
          break;
      }
    };

    checkPayment();
  }, [searchParams]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-[#606579]">{t("checkingPayment")}</p>
      </div>
    );
  }

  const isSuccess = result.status === "succeeded" || result.status === "processing";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md text-center">
        {isSuccess ? (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
        ) : (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#c32a68]/10">
            <XCircle className="h-8 w-8 text-[#c32a68]" />
          </div>
        )}

        <h1 className="mt-4 text-2xl font-bold text-[#1f1f2d]">
          {result.message}
        </h1>

        {isSuccess && (
          <div className="mt-6 rounded-lg border border-success/20 bg-success/10 p-3">
            <p className="text-sm text-[#4b5563]">
              {t("meetingLinkInfo")}
            </p>
          </div>
        )}

        <div className="mt-8 space-y-3">
          {isSuccess ? (
            <>
              <button
                onClick={() => router.push("/settings?tab=my-lessons")}
                className="h-11 w-full rounded-[10px] border-2 border-[#1d4ed8] bg-[#2563eb] text-lg font-semibold text-white hover:bg-[#1d4ed8]"
              >
                {t("goToMyLessons")}
              </button>
              <button
                onClick={() => router.push("/")}
                className="h-11 w-full rounded-[10px] border border-[#cfd3e1] bg-white text-lg font-medium text-[#4b5563] hover:bg-gray-50"
              >
                {tc("backToHome")}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/checkout")}
                className="h-11 w-full rounded-[10px] border-2 border-[#1d4ed8] bg-[#2563eb] text-lg font-semibold text-white hover:bg-[#1d4ed8]"
              >
                {t("tryAgain")}
              </button>
              <button
                onClick={() => router.push("/")}
                className="h-11 w-full rounded-[10px] border border-[#cfd3e1] bg-white text-lg font-medium text-[#4b5563] hover:bg-gray-50"
              >
                {tc("backToHome")}
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-sm text-[#606579]">Loading…</p>
        </div>
      }
    >
      <CheckoutCompleteContent />
    </Suspense>
  );
}
