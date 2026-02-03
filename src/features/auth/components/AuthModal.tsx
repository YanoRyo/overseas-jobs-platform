"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignup } from "../hooks/useSignup";
import { useLogin } from "../hooks/useLogin";
import { SocialAuthButtons } from "./SocialAuthButtons";
import { AuthDivider } from "./AuthDivider";
import type { UserRole } from "../types";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  title?: string;
  description?: string;
  redirectOnClose?: string;
  defaultMode?: "signup" | "login";
};

export const AuthModal = ({
  open,
  onClose,
  initialRole,
  title,
  description,
  redirectOnClose = "/",
  defaultMode = "signup",
}: AuthModalProps) => {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">(defaultMode);

  const signup = useSignup({ initialRole });
  const login = useLogin({ initialRole });

  const handleClose = () => {
    onClose();
    if (redirectOnClose) {
      router.push(redirectOnClose);
    }
  };

  const inputClassName =
    "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-blue-200";

  const activeTabClass =
    "flex-1 py-2 text-sm font-semibold text-accent border-b-2 border-accent";
  const inactiveTabClass =
    "flex-1 py-2 text-sm font-medium text-muted border-b-2 border-transparent hover:text-primary";

  const displayTitle =
    title || (mode === "signup" ? "Create your account" : "Log in");

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <Dialog.Panel className="relative z-10 bg-surface rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Dialog.Title className="text-2xl font-bold text-primary">
            {displayTitle}
          </Dialog.Title>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted hover:text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {description && (
          <p className="text-secondary text-sm mb-4">{description}</p>
        )}

        {/* Tab switcher */}
        <div className="flex mb-6">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={mode === "signup" ? activeTabClass : inactiveTabClass}
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={mode === "login" ? activeTabClass : inactiveTabClass}
          >
            Log in
          </button>
        </div>

        {mode === "signup" ? (
          /* Signup form */
          <>
            <SocialAuthButtons
              onGoogle={signup.handleGoogleSignup}
              onFacebook={signup.handleFacebookSignup}
              disabled={signup.loading}
            />

            <div className="my-6">
              <AuthDivider />
            </div>

            <form onSubmit={signup.handleEmailSignup} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  className={inputClassName}
                  value={signup.email}
                  onChange={(e) => signup.setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  className={inputClassName}
                  value={signup.password}
                  onChange={(e) => signup.setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Confirm password"
                  className={inputClassName}
                  value={signup.confirmPassword}
                  onChange={(e) => signup.setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={signup.loading}
                className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signup.loading ? "Creating account..." : "Sign up"}
              </button>
            </form>
          </>
        ) : (
          /* Login form */
          <>
            <SocialAuthButtons
              onGoogle={login.handleGoogleLogin}
              onFacebook={login.handleFacebookLogin}
              disabled={login.loading}
            />

            <div className="my-6">
              <AuthDivider />
            </div>

            <form onSubmit={login.handleSubmit} className="space-y-4">
              {login.error && (
                <p className="text-sm text-error">{login.error}</p>
              )}
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  className={inputClassName}
                  value={login.email}
                  onChange={(e) => login.setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  className={inputClassName}
                  value={login.password}
                  onChange={(e) => login.setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={login.loading}
                className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {login.loading ? "Logging in..." : "Log in"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          By continuing, you agree to our{" "}
          <Link href="/policy" className="text-accent hover:underline">
            Terms & Privacy Policy
          </Link>
          .
        </p>
      </Dialog.Panel>
    </Dialog>
  );
};
