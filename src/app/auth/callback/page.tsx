"use client";
import { Suspense } from "react";
import { useAuthCallback } from "@/features/auth/hooks/useAuthCallback";

function AuthCallbackContent() {
  useAuthCallback();
  return <p>ログイン処理中...</p>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p>ログイン処理中...</p>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
