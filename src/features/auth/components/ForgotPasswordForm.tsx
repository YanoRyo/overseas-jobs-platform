"use client";

import Link from "next/link";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { AuthShell } from "./AuthShell";

export const ForgotPasswordForm = () => {
  const { email, loading, message, setEmail, handleSubmit } =
    useForgotPassword();

  const inputClassName =
    "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <AuthShell
      title="Forgot password"
      description={
        <p className="text-sm text-secondary">
          Remembered it?{" "}
          <Link href="/auth/login" className="text-accent hover:underline">
            Back to login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm text-secondary">
          Enter your email and we&apos;ll send a reset link.
        </p>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-primary">Email</label>
          <input
            type="email"
            className={inputClassName}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {message && <p className="text-xs text-secondary">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
};
