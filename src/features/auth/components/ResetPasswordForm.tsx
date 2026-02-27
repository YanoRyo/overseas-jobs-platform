"use client";

import Link from "next/link";
import { useResetPassword } from "../hooks/useResetPassword";
import { AuthShell } from "./AuthShell";

export const ResetPasswordForm = () => {
  const {
    password,
    confirmPassword,
    loading,
    checking,
    canReset,
    error,
    message,
    setPassword,
    setConfirmPassword,
    handleSubmit,
  } = useResetPassword();

  const inputClassName =
    "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <AuthShell title="Reset password">
      {checking ? (
        <p className="text-sm text-secondary">Checking reset link...</p>
      ) : canReset ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="text-sm text-error">{error}</p>}
          {message && <p className="text-sm text-secondary">{message}</p>}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-primary">
              New password
            </label>
            <input
              type="password"
              className={inputClassName}
              placeholder="Enter a new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-primary">
              Confirm password
            </label>
            <input
              type="password"
              className={inputClassName}
              placeholder="Re-enter the new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update password"}
          </button>

          <p className="text-xs text-secondary">
            After updating, you can log in again from{" "}
            <Link href="/auth/login" className="text-accent hover:underline">
              the login page
            </Link>
            .
          </p>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            This reset link is invalid or expired.
          </p>
          <Link
            href="/auth/forgot-password"
            className="text-sm font-semibold text-accent hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      )}
    </AuthShell>
  );
};
