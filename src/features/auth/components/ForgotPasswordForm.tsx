"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AUTH_INPUT_CLASS_NAME, AUTH_SUBMIT_BUTTON_CLASS_NAME } from "../constants/styles";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { AuthNoticeDialog } from "./AuthNoticeDialog";
import { AuthShell } from "./AuthShell";

export const ForgotPasswordForm = () => {
  const t = useTranslations("auth.forgotPassword");
  const {
    email,
    loading,
    successMessage,
    setEmail,
    handleSubmit,
    handleSuccessClose,
  } =
    useForgotPassword();

  return (
    <>
      <AuthShell
        title={t("title")}
        description={
          <p className="text-sm text-secondary">
            {t("rememberedIt")}{" "}
            <Link href="/auth/login" className="text-accent hover:underline">
              {t("backToLogin")}
            </Link>
          </p>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-secondary">
            {t("instruction")}
          </p>

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

          <button
            type="submit"
            disabled={loading}
            className={AUTH_SUBMIT_BUTTON_CLASS_NAME}
          >
            {loading ? t("sending") : t("submit")}
          </button>
        </form>
      </AuthShell>

      <AuthNoticeDialog
        open={!!successMessage}
        title={t("emailSent")}
        description={successMessage ?? t("emailSentDescription")}
        primaryLabel={t("gotIt")}
        onPrimary={handleSuccessClose}
      />
    </>
  );
};
