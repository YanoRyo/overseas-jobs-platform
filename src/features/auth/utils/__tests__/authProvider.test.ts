import { describe, test, expect } from "vitest";
import type { User, UserIdentity } from "@supabase/supabase-js";
import { isEmailProvider } from "../authProvider";

function buildUser(identities: Partial<UserIdentity>[]): User {
  return {
    id: "user-1",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2025-01-01T00:00:00Z",
    identities: identities.map((partial, i) => ({
      id: `identity-${i}`,
      user_id: "user-1",
      identity_id: `identity-${i}`,
      provider: partial.provider ?? "unknown",
      created_at: "2025-01-01T00:00:00Z",
      last_sign_in_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      ...partial,
    })),
  };
}

describe("isEmailProvider", () => {
  test("should return false when user is null", () => {
    expect(isEmailProvider(null)).toBe(false);
  });

  test("should return true when user has email identity", () => {
    const user = buildUser([{ provider: "email" }]);

    expect(isEmailProvider(user)).toBe(true);
  });

  test("should return false when user has only google identity", () => {
    const user = buildUser([{ provider: "google" }]);

    expect(isEmailProvider(user)).toBe(false);
  });

  test("should return false when user has only facebook identity", () => {
    const user = buildUser([{ provider: "facebook" }]);

    expect(isEmailProvider(user)).toBe(false);
  });

  test("should return true when user has multiple identities including email", () => {
    const user = buildUser([{ provider: "google" }, { provider: "email" }]);

    expect(isEmailProvider(user)).toBe(true);
  });

  test("should return false when identities array is empty", () => {
    const user = buildUser([]);

    expect(isEmailProvider(user)).toBe(false);
  });

  test("should return false when identities is undefined", () => {
    const user: User = {
      id: "user-1",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2025-01-01T00:00:00Z",
    };

    expect(isEmailProvider(user)).toBe(false);
  });
});
