"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AUTH_INPUT_CLASS_NAME, AUTH_SUBMIT_BUTTON_CLASS_NAME } from "../constants/styles";
import { useResetPassword } from "../hooks/useResetPassword";
import { AuthShell } from "./AuthShell";
import { PasswordField } from "./PasswordField";

export const ResetPasswordForm = () => {
  const t = useTranslations("auth.resetPassword");
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
    <AuthShell title={t("title")}>
      {checking ? (
        <p className="text-sm text-secondary">{t("checkingLink")}</p>
      ) : isSuccess ? (
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            {t("success")}
          </p>
          <Link
            href="/auth/login"
            className="text-sm font-semibold text-accent hover:underline"
          >
            {t("goToLogin")}
          </Link>
        </div>
      ) : canReset ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="text-sm text-error">{error}</p>}

          <PasswordField
            label={t("newPassword")}
            placeholder={t("newPasswordPlaceholder")}
            value={password}
            onChange={setPassword}
            required
            className={AUTH_INPUT_CLASS_NAME}
          />

          <PasswordField
            label={t("confirmPassword")}
            placeholder={t("confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            className={AUTH_INPUT_CLASS_NAME}
          />

          <button
            type="submit"
            disabled={loading}
            className={AUTH_SUBMIT_BUTTON_CLASS_NAME}
          >
            {loading ? t("updating") : t("submit")}
          </button>

          <p className="text-xs text-secondary">
            {t("helperText")}
          </p>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            {t("invalidLink")}
          </p>
          <Link
            href="/auth/forgot-password"
            className="text-sm font-semibold text-accent hover:underline"
          >
            {t("requestNewLink")}
          </Link>
        </div>
      )}
    </AuthShell>
  );
};
