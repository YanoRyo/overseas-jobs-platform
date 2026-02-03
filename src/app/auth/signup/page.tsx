"use client";
import { Suspense } from "react";
import { SignupForm } from "@/features/auth/components/SignupForm";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SignupForm />
    </Suspense>
  );
}
