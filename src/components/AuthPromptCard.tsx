type AuthPromptCardProps = {
  message: string;
  loginLabel: string;
  onLogin: () => void;
  signUpLabel?: string;
  onSignUp?: () => void;
  className?: string;
};

export function AuthPromptCard({
  message,
  loginLabel,
  onLogin,
  signUpLabel,
  onSignUp,
  className = "",
}: AuthPromptCardProps) {
  return (
    <div
      className={`rounded-[24px] border border-[#dbeafe] bg-white px-4 py-4 text-sm text-[#5b6477] shadow-[0_18px_40px_rgba(37,99,235,0.08)] ${className}`}
    >
      <p>{message}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onLogin}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          {loginLabel}
        </button>
        {signUpLabel && onSignUp && (
          <button
            type="button"
            onClick={onSignUp}
            className="rounded-full border border-[#dbeafe] bg-white px-5 py-2.5 text-sm font-semibold text-[#1d4ed8] shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition hover:bg-[#f8fbff]"
          >
            {signUpLabel}
          </button>
        )}
      </div>
    </div>
  );
}
