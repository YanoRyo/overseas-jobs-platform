"use client";
import { Link } from "@/i18n/navigation";
import { useSignup } from "../hooks/useSignup";
import { AuthNoticeDialog } from "./AuthNoticeDialog";
import { AuthShell } from "./AuthShell";
import { AuthDivider } from "./AuthDivider";
import { PasswordField } from "./PasswordField";
import { RoleSelector } from "./RoleSelector";
import { SocialAuthButtons } from "./SocialAuthButtons";

type SignupFormProps = {
  redirect?: string;
};

export const SignupForm = ({ redirect }: SignupFormProps) => {
  const loginHref = redirect
    ? `/auth/login?redirect=${encodeURIComponent(redirect)}`
    : "/auth/login";
  const {
    email,
    password,
    confirmPassword,
    role,
    loading,
    successMessage,
    setEmail,
    setPassword,
    setConfirmPassword,
    setRole,
    handleEmailSignup,
    handleSuccessClose,
    handleGoogleSignup,
    handleFacebookSignup,
  } = useSignup({ redirect: redirect || "/" });

  const inputClassName =
    "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <>
      <AuthShell
        title="Create your account"
        description={
          <p className="text-sm text-secondary">
            Already have an account?{" "}
            <Link href={loginHref} className="text-accent hover:underline">
              Log in
            </Link>
          </p>
        }
      >
        <div className="space-y-6">
          <RoleSelector
            value={role}
            onChange={setRole}
            hint="Required to complete sign up."
          />
          <SocialAuthButtons
            onGoogle={handleGoogleSignup}
            onFacebook={handleFacebookSignup}
            disabled={loading || !role}
          />

          <AuthDivider />

          <form onSubmit={handleEmailSignup} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-primary">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={inputClassName}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <PasswordField
              label="Password"
              placeholder="Create a password"
              value={password}
              onChange={setPassword}
              className={inputClassName}
            />

            <PasswordField
              label="Confirm password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              className={inputClassName}
            />

            <button
              disabled={loading || !role}
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p className="text-center text-xs text-muted">
            By continuing, you agree to our{" "}
            <Link href="/policy" className="text-accent hover:underline">
              Terms & Privacy Policy
            </Link>
            .
          </p>
        </div>
      </AuthShell>

      <AuthNoticeDialog
        open={!!successMessage}
        title="Check Your Inbox"
        description={
          successMessage ??
          "We've sent a confirmation email. Please use the link in your inbox to finish creating your account."
        }
        primaryLabel="Back to login"
        onPrimary={handleSuccessClose}
      />
    </>
  );
};
