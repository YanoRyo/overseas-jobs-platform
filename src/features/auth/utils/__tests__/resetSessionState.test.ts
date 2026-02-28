import { describe, test, expect } from "vitest";
import {
  resolveResetSessionState,
  INITIAL_RESET_SESSION_STATE,
} from "../resetSessionState";

describe("resolveResetSessionState", () => {
  test("should return initial state with checking true and canReset false", () => {
    expect(INITIAL_RESET_SESSION_STATE).toEqual({
      checking: true,
      canReset: false,
    });
  });

  describe("PASSWORD_RECOVERY event", () => {
    test("should set canReset to true regardless of session", () => {
      const result = resolveResetSessionState(
        "PASSWORD_RECOVERY",
        false,
        INITIAL_RESET_SESSION_STATE,
      );

      expect(result).toEqual({ checking: false, canReset: true });
    });

    test("should set canReset to true even when session exists", () => {
      const result = resolveResetSessionState(
        "PASSWORD_RECOVERY",
        true,
        INITIAL_RESET_SESSION_STATE,
      );

      expect(result).toEqual({ checking: false, canReset: true });
    });
  });

  describe("INITIAL_SESSION event", () => {
    test("should set canReset to true when session exists", () => {
      const result = resolveResetSessionState(
        "INITIAL_SESSION",
        true,
        INITIAL_RESET_SESSION_STATE,
      );

      expect(result).toEqual({ checking: false, canReset: true });
    });

    test("should set canReset to false when session is absent", () => {
      const result = resolveResetSessionState(
        "INITIAL_SESSION",
        false,
        INITIAL_RESET_SESSION_STATE,
      );

      expect(result).toEqual({ checking: false, canReset: false });
    });
  });

  describe("SIGNED_IN event", () => {
    test("should set canReset to true when session exists", () => {
      const result = resolveResetSessionState(
        "SIGNED_IN",
        true,
        INITIAL_RESET_SESSION_STATE,
      );

      expect(result).toEqual({ checking: false, canReset: true });
    });

    test("should set canReset to false when session is absent", () => {
      const result = resolveResetSessionState(
        "SIGNED_IN",
        false,
        INITIAL_RESET_SESSION_STATE,
      );

      expect(result).toEqual({ checking: false, canReset: false });
    });
  });

  describe("SIGNED_OUT event", () => {
    test("should set canReset to false when session is absent", () => {
      const current = { checking: false, canReset: true };

      const result = resolveResetSessionState("SIGNED_OUT", false, current);

      expect(result).toEqual({ checking: false, canReset: false });
    });

    test("should set canReset based on session presence", () => {
      const current = { checking: false, canReset: true };

      const result = resolveResetSessionState("SIGNED_OUT", true, current);

      expect(result).toEqual({ checking: false, canReset: true });
    });
  });

  describe("unhandled events", () => {
    test("should return current state for TOKEN_REFRESHED event", () => {
      const current = { checking: false, canReset: true };

      const result = resolveResetSessionState("TOKEN_REFRESHED", false, current);

      expect(result).toBe(current);
    });

    test("should return current state for USER_UPDATED event", () => {
      const current = { checking: true, canReset: false };

      const result = resolveResetSessionState("USER_UPDATED", true, current);

      expect(result).toBe(current);
    });
  });
});
