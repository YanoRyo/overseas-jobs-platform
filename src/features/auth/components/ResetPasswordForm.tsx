"use client";

import Link from "next/link";
import { AUTH_INPUT_CLASS_NAME, AUTH_SUBMIT_BUTTON_CLASS_NAME } from "../constants/styles";
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
    isSuccess,
    setPassword,
    setConfirmPassword,
    handleSubmit,
  } = useResetPassword();

  return (
    <AuthShell title="Reset password">
      {checking ? (
        <p className="text-sm text-secondary">Checking reset link...</p>
      ) : isSuccess ? (
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Password updated. Please log in with your new password.
          </p>
          <Link
            href="/auth/login"
            className="text-sm font-semibold text-accent hover:underline"
          >
            Go to login
          </Link>
        </div>
      ) : canReset ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="text-sm text-error">{error}</p>}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-primary">
              New password
            </label>
            <input
              type="password"
              className={AUTH_INPUT_CLASS_NAME}
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
              className={AUTH_INPUT_CLASS_NAME}
              placeholder="Re-enter the new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={AUTH_SUBMIT_BUTTON_CLASS_NAME}
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
