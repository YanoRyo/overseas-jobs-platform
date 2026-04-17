"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog } from "@headlessui/react";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useSignup } from "../hooks/useSignup";
import { useLogin } from "../hooks/useLogin";
import { SocialAuthButtons } from "./SocialAuthButtons";
import { AuthDivider } from "./AuthDivider";
import { AuthNoticeDialog } from "./AuthNoticeDialog";
import { SignupAgreementField } from "./SignupAgreementField";
import type { AuthModalVariant, UserRole } from "../types";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  variant?: AuthModalVariant;
  title?: string;
  description?: string;
  redirectAfterAuth?: string;
  defaultMode?: "signup" | "login";
};

export const AuthModal = ({
  open,
  onClose,
  initialRole,
  variant,
  title,
  description,
  redirectAfterAuth,
  defaultMode = "signup",
}: AuthModalProps) => {
  const tLogin = useTranslations("auth.login");
  const tSignup = useTranslations("auth.signup");
  const tAuthModal = useTranslations("authModal");
  const tc = useTranslations("common");
  const { session } = useSessionContext();
  const [mode, setMode] = useState<"signup" | "login">(defaultMode);
  const [hasAgreedToPolicies, setHasAgreedToPolicies] = useState(false);
  const resolvedRole = useMemo<UserRole>(
    () => (initialRole === "mentor" ? "mentor" : "student"),
    [initialRole]
  );

  const {
    email: signupEmail,
    password: signupPassword,
    confirmPassword,
    loading: signupLoading,
    successMessage,
    setEmail: setSignupEmail,
    setPassword: setSignupPassword,
    setConfirmPassword,
    setRole: setSignupRole,
    handleEmailSignup,
    handleSuccessClose,
    handleGoogleSignup,
    handleFacebookSignup,
  } = useSignup({
    initialRole: resolvedRole,
    redirect: redirectAfterAuth,
    onSuccessClose: () => setMode("login"),
  });
  const {
    email: loginEmail,
    password: loginPassword,
    loading: loginLoading,
    error: loginError,
    setEmail: setLoginEmail,
    setPassword: setLoginPassword,
    setRole: setLoginRole,
    handleSubmit,
    handleGoogleLogin,
    handleFacebookLogin,
  } = useLogin({ initialRole: resolvedRole, redirect: redirectAfterAuth });

  useEffect(() => {
    if (!open) {
      return;
    }

    setMode(defaultMode);
    setHasAgreedToPolicies(false);
    setSignupRole(resolvedRole);
    setLoginRole(resolvedRole);
  }, [defaultMode, open, resolvedRole, setLoginRole, setSignupRole]);

  useEffect(() => {
    if (open && session?.user) {
      onClose();
    }
  }, [onClose, open, session]);

  const handleClose = () => {
    onClose();
  };

  const inputClassName =
    "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-blue-200";

  const activeTabClass =
    "flex-1 py-2 text-sm font-semibold text-accent border-b-2 border-accent";
  const inactiveTabClass =
    "flex-1 py-2 text-sm font-medium text-muted border-b-2 border-transparent hover:text-primary";

  const contextualTitle = variant ? tAuthModal(`${variant}.title`) : undefined;
  const contextualDescription = variant
    ? tAuthModal(`${variant}.description`)
    : undefined;
  const displayTitle =
    title
    ?? contextualTitle
    ?? (mode === "signup" ? tSignup("title") : tLogin("title"));
  const displayDescription = description ?? contextualDescription;

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

        {displayDescription && (
          <p className="text-secondary text-sm mb-4">{displayDescription}</p>
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
              onGoogle={handleGoogleSignup}
              onFacebook={handleFacebookSignup}
              disabled={signupLoading || !hasAgreedToPolicies}
            />

            <div className="my-6">
              <AuthDivider label={tc("or")} />
            </div>

            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder={tSignup("email")}
                  className={inputClassName}
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder={tSignup("password")}
                  className={inputClassName}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder={tSignup("confirmPassword")}
                  className={inputClassName}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <SignupAgreementField
                checked={hasAgreedToPolicies}
                onChange={setHasAgreedToPolicies}
              />
              <button
                type="submit"
                disabled={signupLoading || !hasAgreedToPolicies}
                className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signupLoading ? tSignup("creatingAccount") : tSignup("submit")}
              </button>
            </form>
          </>
        ) : (
          /* Login form */
          <>
            <SocialAuthButtons
              onGoogle={handleGoogleLogin}
              onFacebook={handleFacebookLogin}
              disabled={loginLoading}
            />

            <div className="my-6">
              <AuthDivider label={tc("or")} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {loginError && (
                <p className="text-sm text-error">{loginError}</p>
              )}
              <div>
                <input
                  type="email"
                  placeholder={tLogin("email")}
                  className={inputClassName}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder={tLogin("password")}
                  className={inputClassName}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loginLoading ? tLogin("loggingIn") : tLogin("submit")}
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

      <AuthNoticeDialog
        open={!!successMessage}
        title={tSignup("checkInbox")}
        description={successMessage ?? tSignup("confirmationSent")}
        primaryLabel={tSignup("backToLogin")}
        onPrimary={handleSuccessClose}
      />
    </Dialog>
  );
};
