import { describe, test, expect } from "vitest";
import {
  isEmailNotConfirmedError,
  shouldSuggestVerificationResend,
  toResendErrorMessage,
  toResetPasswordErrorMessage,
} from "../authError";

describe("isEmailNotConfirmedError", () => {
  test("should return false when error is null", () => {
    expect(isEmailNotConfirmedError(null)).toBe(false);
  });

  test("should return true when code is email_not_confirmed", () => {
    const error = { code: "email_not_confirmed" };

    expect(isEmailNotConfirmedError(error)).toBe(true);
  });

  test("should return true when code is provider_email_needs_verification", () => {
    const error = { code: "provider_email_needs_verification" };

    expect(isEmailNotConfirmedError(error)).toBe(true);
  });

  test("should return true when message contains 'email not confirmed' (case-insensitive)", () => {
    const error = { code: null, message: "Email not confirmed" };

    expect(isEmailNotConfirmedError(error)).toBe(true);
  });

  test("should return true when message contains 'email is not confirmed' (case-insensitive)", () => {
    const error = { code: null, message: "Email Is Not Confirmed" };

    expect(isEmailNotConfirmedError(error)).toBe(true);
  });

  test("should return false when code and message are unrelated", () => {
    const error = { code: "some_other_code", message: "Something went wrong" };

    expect(isEmailNotConfirmedError(error)).toBe(false);
  });

  test("should return false when error has no code and no matching message", () => {
    const error = { code: null, message: "Some other error" };

    expect(isEmailNotConfirmedError(error)).toBe(false);
  });

  test("should return false when error has no code and no message", () => {
    const error = { code: null, message: null };

    expect(isEmailNotConfirmedError(error)).toBe(false);
  });

  test("should prioritize code over message", () => {
    const error = {
      code: "email_not_confirmed",
      message: "Unrelated message",
    };

    expect(isEmailNotConfirmedError(error)).toBe(true);
  });
});

describe("shouldSuggestVerificationResend", () => {
  test("should return false when error is null", () => {
    expect(shouldSuggestVerificationResend(null)).toBe(false);
  });

  test("should return true when isEmailNotConfirmedError returns true", () => {
    const error = { code: "email_not_confirmed" };

    expect(shouldSuggestVerificationResend(error)).toBe(true);
  });

  test("should return true when code is invalid_credentials", () => {
    const error = { code: "invalid_credentials" };

    expect(shouldSuggestVerificationResend(error)).toBe(true);
  });

  test("should return true when message contains 'invalid login credentials' (case-insensitive)", () => {
    const error = { code: null, message: "Invalid login credentials" };

    expect(shouldSuggestVerificationResend(error)).toBe(true);
  });

  test("should return true when message has mixed case 'Invalid Login Credentials'", () => {
    const error = { code: null, message: "Invalid Login Credentials" };

    expect(shouldSuggestVerificationResend(error)).toBe(true);
  });

  test("should return false when code and message are unrelated", () => {
    const error = {
      code: "some_other_code",
      message: "Something went wrong",
    };

    expect(shouldSuggestVerificationResend(error)).toBe(false);
  });

  test("should return false when error has no code and no message", () => {
    const error = { code: null, message: null };

    expect(shouldSuggestVerificationResend(error)).toBe(false);
  });
});

describe("toResendErrorMessage", () => {
  test("should return null when error is null", () => {
    expect(toResendErrorMessage(null)).toBeNull();
  });

  test("should return rate limit message when code is over_email_send_rate_limit", () => {
    const error = { code: "over_email_send_rate_limit" };

    expect(toResendErrorMessage(error)).toBe(
      "Please wait a moment before requesting another email."
    );
  });

  test("should return generic message for other error codes", () => {
    const error = { code: "some_other_error" };

    expect(toResendErrorMessage(error)).toBe(
      "Could not resend the verification email. Please try again."
    );
  });

  test("should return generic message when code is null", () => {
    const error = { code: null };

    expect(toResendErrorMessage(error)).toBe(
      "Could not resend the verification email. Please try again."
    );
  });
});

describe("toResetPasswordErrorMessage", () => {
  test("should return null when error is null", () => {
    expect(toResetPasswordErrorMessage(null)).toBeNull();
  });

  test("should return different password message when code is same_password", () => {
    const error = { code: "same_password" };

    expect(toResetPasswordErrorMessage(error)).toBe(
      "Please choose a different password."
    );
  });

  test("should return stronger password message when code is weak_password", () => {
    const error = { code: "weak_password" };

    expect(toResetPasswordErrorMessage(error)).toBe(
      "Please choose a stronger password."
    );
  });

  test("should return generic message for other error codes", () => {
    const error = { code: "unknown_error" };

    expect(toResetPasswordErrorMessage(error)).toBe(
      "Could not update password. Please request a new reset link."
    );
  });

  test("should return generic message when code is null", () => {
    const error = { code: null };

    expect(toResetPasswordErrorMessage(error)).toBe(
      "Could not update password. Please request a new reset link."
    );
  });
});
