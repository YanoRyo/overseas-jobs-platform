type AuthErrorLike = {
  code?: string | null;
  message?: string | null;
};

const EMAIL_NOT_CONFIRMED_CODES = new Set([
  "email_not_confirmed",
  "provider_email_needs_verification",
]);

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

export const toResendErrorMessage = (error: AuthErrorLike | null) => {
  if (!error) return null;

  if (error.code === "over_email_send_rate_limit") {
    return "Please wait a moment before requesting another email.";
  }

  return "Could not resend the verification email. Please try again.";
};
