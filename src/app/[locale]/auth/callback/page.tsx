"use client";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { useAuthCallback } from "@/features/auth/hooks/useAuthCallback";

function AuthCallbackContent() {
  const t = useTranslations("auth");
  useAuthCallback();
  return <p>{t("signingIn")}</p>;
}

function AuthCallbackFallback() {
  const t = useTranslations("auth");
  return <p>{t("signingIn")}</p>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
