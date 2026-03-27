"use client";

import type { UserRole } from "../types";

type SyncUserProfileResult = {
  ok: boolean;
  error?: string;
};

export async function syncUserProfile(
  role?: UserRole | null
): Promise<SyncUserProfileResult> {
  try {
    const response = await fetch("/api/auth/sync-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      return {
        ok: false,
        error: body?.error ?? "Failed to sync user profile",
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("syncUserProfile request error", error);
    return {
      ok: false,
      error: "Failed to sync user profile",
    };
  }
}
