"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AUTH_INPUT_CLASS_NAME, AUTH_SUBMIT_BUTTON_CLASS_NAME } from "../constants/styles";
import { useLogin } from "../hooks/useLogin";
import { AuthShell } from "./AuthShell";
import { AuthDivider } from "./AuthDivider";
import { EmailVerificationAlert } from "./EmailVerificationAlert";
import { PasswordField } from "./PasswordField";
import { RoleSelector } from "./RoleSelector";
import { SocialAuthButtons } from "./SocialAuthButtons";

type LoginFormProps = {
  redirect?: string;
};

export const LoginForm = ({ redirect }: LoginFormProps) => {
  const t = useTranslations("auth.login");
  const signupHref = redirect
    ? `/auth/signup?redirect=${encodeURIComponent(redirect)}`
    : "/auth/signup";
  const {
    email,
    password,
    loading,
    error,
    needsEmailVerification,
    resendLoading,
    resendMessage,
    role,
    setEmail,
    setPassword,
    setRole,
    handleSubmit,
    handleResendVerification,
    handleGoogleLogin,
    handleFacebookLogin,
  } = useLogin({ redirect: redirect || "/" });

  return (
    <AuthShell
      title={t("title")}
      description={
        <p className="text-sm text-secondary">
          {t("newHere")}{" "}
          <Link href={signupHref} className="text-accent hover:underline">
            {t("createAccount")}
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
          onGoogle={handleGoogleLogin}
          onFacebook={handleFacebookLogin}
          disabled={loading || !role}
        />

        <AuthDivider />

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="text-sm text-error">{error}</p>}
          {needsEmailVerification && (
            <EmailVerificationAlert
              onResend={handleResendVerification}
              resendLoading={resendLoading}
              resendMessage={resendMessage}
            />
          )}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-primary">{t("email")}</label>
            <input
              type="email"
              className={AUTH_INPUT_CLASS_NAME}
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <PasswordField
            label={t("password")}
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={setPassword}
            required
            className={AUTH_INPUT_CLASS_NAME}
          />

          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-accent hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={AUTH_SUBMIT_BUTTON_CLASS_NAME}
          >
            {loading ? t("loggingIn") : t("submit")}
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
  );
};
