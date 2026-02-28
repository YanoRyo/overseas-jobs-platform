import { describe, test, expect } from "vitest";
import { validateChangePasswordForm } from "../useChangePassword";

describe("validateChangePasswordForm", () => {
  test("should return error when all fields are empty", () => {
    const result = validateChangePasswordForm("", "", "");

    expect(result).toBe("Please fill in all fields.");
  });

  test("should return error when currentPassword is empty", () => {
    const result = validateChangePasswordForm("", "newPass123", "newPass123");

    expect(result).toBe("Please fill in all fields.");
  });

  test("should return error when newPassword is empty", () => {
    const result = validateChangePasswordForm("currentPass", "", "newPass123");

    expect(result).toBe("Please fill in all fields.");
  });

  test("should return error when confirmPassword is empty", () => {
    const result = validateChangePasswordForm("currentPass", "newPass123", "");

    expect(result).toBe("Please fill in all fields.");
  });

  test("should return error when new passwords do not match", () => {
    const result = validateChangePasswordForm(
      "currentPass",
      "newPass123",
      "differentPass456",
    );

    expect(result).toBe("Passwords do not match.");
  });

  test("should return null when all fields are valid and passwords match", () => {
    const result = validateChangePasswordForm(
      "currentPass",
      "newPass123",
      "newPass123",
    );

    expect(result).toBeNull();
  });

  test("should return error when newPassword and confirmPassword are whitespace only", () => {
    const result = validateChangePasswordForm("currentPass", "   ", "   ");

    expect(result).toBe("Please fill in all fields.");
  });

  test("should return error when currentPassword is whitespace only", () => {
    const result = validateChangePasswordForm("   ", "newPass123", "newPass123");

    expect(result).toBe("Please fill in all fields.");
  });
});
