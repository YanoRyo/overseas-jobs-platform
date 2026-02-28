export type ResetSessionState = {
  checking: boolean;
  canReset: boolean;
};

export const INITIAL_RESET_SESSION_STATE: ResetSessionState = {
  checking: true,
  canReset: false,
};

export function resolveResetSessionState(
  event: string,
  hasSession: boolean,
  current: ResetSessionState,
): ResetSessionState {
  switch (event) {
    case "PASSWORD_RECOVERY":
      return { checking: false, canReset: true };
    case "SIGNED_IN":
    case "INITIAL_SESSION":
    case "SIGNED_OUT":
      return { checking: false, canReset: hasSession };
    default:
      return current;
  }
}
