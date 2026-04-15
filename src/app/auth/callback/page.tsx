"use client";
import { Suspense } from "react";
import { useAuthCallback } from "@/features/auth/hooks/useAuthCallback";

function AuthCallbackContent() {
  useAuthCallback();
  return <p>Signing you in...</p>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p>Signing you in...</p>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
