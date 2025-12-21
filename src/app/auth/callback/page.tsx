"use client";
import { useAuthCallback } from "@/features/auth/hooks/useAuthCallback";

export default function AuthCallbackPage() {
  useAuthCallback();
  return <p>ログイン処理中...</p>;
}
