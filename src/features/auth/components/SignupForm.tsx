"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSignup } from "../hooks/useSignup";
import { AuthNoticeDialog } from "./AuthNoticeDialog";
import { AuthShell } from "./AuthShell";
import { AuthDivider } from "./AuthDivider";
import { PasswordField } from "./PasswordField";
import { RoleSelector } from "./RoleSelector";
import { SocialAuthButtons } from "./SocialAuthButtons";

type SignupFormProps = {
  redirect?: string;
};

export const SignupForm = ({ redirect }: SignupFormProps) => {
  const t = useTranslations("auth.signup");
  const loginHref = redirect
    ? `/auth/login?redirect=${encodeURIComponent(redirect)}`
    : "/auth/login";
  const {
    email,
    password,
    confirmPassword,
    role,
    loading,
    successMessage,
    setEmail,
    setPassword,
    setConfirmPassword,
    setRole,
    handleEmailSignup,
    handleSuccessClose,
    handleGoogleSignup,
    handleFacebookSignup,
  } = useSignup({ redirect: redirect || "/" });

  const inputClassName =
    "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <>
      <AuthShell
        title={t("title")}
        description={
          <p className="text-sm text-secondary">
            {t("alreadyHaveAccount")}{" "}
            <Link href={loginHref} className="text-accent hover:underline">
              {t("loginLink")}
            </Link>
          </p>
        }
      >
        <div className="space-y-6">
          <RoleSelector
            value={role}
            onChange={setRole}
            hint={t("roleHint")}
          />
          <SocialAuthButtons
            onGoogle={handleGoogleSignup}
            onFacebook={handleFacebookSignup}
            disabled={loading || !role}
          />

          <AuthDivider />

          <form onSubmit={handleEmailSignup} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-primary">{t("email")}</label>
              <input
                type="email"
                placeholder={t("emailPlaceholder")}
                className={inputClassName}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <PasswordField
              label={t("password")}
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={setPassword}
              className={inputClassName}
            />

            <PasswordField
              label={t("confirmPassword")}
              placeholder={t("confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={setConfirmPassword}
              className={inputClassName}
            />

            <button
              disabled={loading || !role}
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t("creatingAccount") : t("submit")}
            </button>
          </form>

          <p className="text-center text-xs text-muted">
            {t("termsNotice").split(t("termsLinkText"))[0]}
            <Link href="/policy" className="text-accent hover:underline">
              {t("termsLinkText")}
            </Link>
            {t("termsNotice").split(t("termsLinkText"))[1]}
          </p>
        </div>
      </AuthShell>

      <AuthNoticeDialog
        open={!!successMessage}
        title={t("checkInbox")}
        description={successMessage ?? t("confirmationSent")}
        primaryLabel={t("backToLogin")}
        onPrimary={handleSuccessClose}
      />
    </>
  );
};
