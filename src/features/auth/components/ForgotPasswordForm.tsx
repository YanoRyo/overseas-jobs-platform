"use client";

import Link from "next/link";
import { AUTH_INPUT_CLASS_NAME, AUTH_SUBMIT_BUTTON_CLASS_NAME } from "../constants/styles";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { AuthShell } from "./AuthShell";

export const ForgotPasswordForm = () => {
  const { email, loading, message, setEmail, handleSubmit } =
    useForgotPassword();

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
            className={AUTH_INPUT_CLASS_NAME}
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
          className={AUTH_SUBMIT_BUTTON_CLASS_NAME}
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
};
