type AuthErrorLike = {
  code?: string | null;
  message?: string | null;
};

const EMAIL_NOT_CONFIRMED_CODES = new Set([
  "email_not_confirmed",
  "provider_email_needs_verification",
]);

const RESEND_CANDIDATE_CODES = new Set(["invalid_credentials"]);

export const isEmailNotConfirmedError = (error: AuthErrorLike | null) => {
  if (!error) return false;

  if (error.code && EMAIL_NOT_CONFIRMED_CODES.has(error.code)) {
    return true;
  }

  const normalizedMessage = error.message?.toLowerCase() ?? "";
  return (
    normalizedMessage.includes("email not confirmed") ||
    normalizedMessage.includes("email is not confirmed")
  );
};

export const shouldSuggestVerificationResend = (error: AuthErrorLike | null) => {
  if (!error) return false;
  if (isEmailNotConfirmedError(error)) return true;

  if (error.code && RESEND_CANDIDATE_CODES.has(error.code)) {
    return true;
  }

  const normalizedMessage = error.message?.toLowerCase() ?? "";
  return normalizedMessage.includes("invalid login credentials");
};

export const toResendErrorMessage = (
  error: AuthErrorLike | null,
): string | null => {
  if (!error) return null;

  if (error.code === "over_email_send_rate_limit") {
    return "Please wait a moment before requesting another email.";
  }

  return "Could not resend the verification email. Please try again.";
};

const RESET_PASSWORD_ERROR_MESSAGES: Record<string, string> = {
  same_password: "Please choose a different password.",
  weak_password: "Please choose a stronger password.",
};

const RESET_PASSWORD_FALLBACK_MESSAGE =
  "Could not update password. Please request a new reset link.";

export const toResetPasswordErrorMessage = (
  error: AuthErrorLike | null,
): string | null => {
  if (!error) return null;

  if (error.code) {
    return (
      RESET_PASSWORD_ERROR_MESSAGES[error.code] ??
      RESET_PASSWORD_FALLBACK_MESSAGE
    );
  }

  return RESET_PASSWORD_FALLBACK_MESSAGE;
};
