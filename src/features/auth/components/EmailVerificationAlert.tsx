type EmailVerificationAlertProps = {
  onResend: () => void;
  resendLoading: boolean;
  resendMessage: string | null;
};

export const EmailVerificationAlert = ({
  onResend,
  resendLoading,
  resendMessage,
}: EmailVerificationAlertProps) => (
  <>
    <div className="space-y-2 rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-xs text-secondary">
        Need a new verification email?
      </p>
      <button
        type="button"
        onClick={onResend}
        disabled={resendLoading}
        className="text-xs font-semibold text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {resendLoading ? "Sending..." : "Resend verification email"}
      </button>
    </div>
    {resendMessage && (
      <p className="text-xs text-secondary">{resendMessage}</p>
    )}
  </>
);
