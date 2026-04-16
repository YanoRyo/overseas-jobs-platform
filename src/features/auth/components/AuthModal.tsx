"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useSignup } from "../hooks/useSignup";
import { useLogin } from "../hooks/useLogin";
import { SocialAuthButtons } from "./SocialAuthButtons";
import { AuthDivider } from "./AuthDivider";
import { SignupAgreementField } from "./SignupAgreementField";
import type { UserRole } from "../types";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  title?: string;
  description?: string;
  redirectOnClose?: string;
  redirectAfterAuth?: string;
  defaultMode?: "signup" | "login";
};

export const AuthModal = ({
  open,
  onClose,
  initialRole,
  title,
  description,
  redirectOnClose = "/",
  redirectAfterAuth,
  defaultMode = "signup",
}: AuthModalProps) => {
  const router = useRouter();
  const tLogin = useTranslations("auth.login");
  const tSignup = useTranslations("auth.signup");
  const tc = useTranslations("common");
  const [mode, setMode] = useState<"signup" | "login">(defaultMode);
  const [hasAgreedToPolicies, setHasAgreedToPolicies] = useState(false);

  const signup = useSignup({ initialRole, redirect: redirectAfterAuth });
  const login = useLogin({ initialRole, redirect: redirectAfterAuth });

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
    title || (mode === "signup" ? tSignup("title") : tLogin("title"));

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
            aria-label={tc("close")}
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
            {tSignup("submit")}
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={mode === "login" ? activeTabClass : inactiveTabClass}
          >
            {tLogin("submit")}
          </button>
        </div>

        {mode === "signup" ? (
          /* Signup form */
          <>
            <SocialAuthButtons
              onGoogle={signup.handleGoogleSignup}
              onFacebook={signup.handleFacebookSignup}
              disabled={signup.loading || !hasAgreedToPolicies}
            />

            <div className="my-6">
              <AuthDivider label={tc("or")} />
            </div>

            <form onSubmit={signup.handleEmailSignup} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder={tSignup("email")}
                  className={inputClassName}
                  value={signup.email}
                  onChange={(e) => signup.setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder={tSignup("password")}
                  className={inputClassName}
                  value={signup.password}
                  onChange={(e) => signup.setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder={tSignup("confirmPassword")}
                  className={inputClassName}
                  value={signup.confirmPassword}
                  onChange={(e) => signup.setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <SignupAgreementField
                checked={hasAgreedToPolicies}
                onChange={setHasAgreedToPolicies}
              />
              <button
                type="submit"
                disabled={signup.loading || !hasAgreedToPolicies}
                className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signup.loading ? tSignup("creatingAccount") : tSignup("submit")}
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
              <AuthDivider label={tc("or")} />
            </div>

            <form onSubmit={login.handleSubmit} className="space-y-4">
              {login.error && (
                <p className="text-sm text-error">{login.error}</p>
              )}
              <div>
                <input
                  type="email"
                  placeholder={tLogin("email")}
                  className={inputClassName}
                  value={login.email}
                  onChange={(e) => login.setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder={tLogin("password")}
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
                {login.loading ? tLogin("loggingIn") : tLogin("submit")}
              </button>
            </form>
          </>
        )}

        {mode === "login" ? (
          <p className="mt-6 text-center text-xs text-muted">
            {tLogin("termsNotice").split(tLogin("termsLinkText"))[0]}
            <Link href="/policy" className="text-accent hover:underline">
              {tLogin("termsLinkText")}
            </Link>
            {tLogin("termsNotice").split(tLogin("termsLinkText"))[1]}
          </p>
        ) : null}
      </Dialog.Panel>
    </Dialog>
  );
};
