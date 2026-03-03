"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AUTH_INPUT_CLASS_NAME, AUTH_SUBMIT_BUTTON_CLASS_NAME } from "../constants/styles";
import { useLogin } from "../hooks/useLogin";
import { AuthShell } from "./AuthShell";
import { AuthDivider } from "./AuthDivider";
import { EmailVerificationAlert } from "./EmailVerificationAlert";
import { RoleSelector } from "./RoleSelector";
import { SocialAuthButtons } from "./SocialAuthButtons";

export const LoginForm = () => {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const signupHref = redirect
    ? `/auth/signup?redirect=${encodeURIComponent(redirect)}`
    : "/auth/signup";
  const {
    email,
    password,
    loading,
    error,
    needsEmailVerification,
    resendLoading,
    resendMessage,
    role,
    setEmail,
    setPassword,
    setRole,
    handleSubmit,
    handleResendVerification,
    handleGoogleLogin,
    handleFacebookLogin,
  } = useLogin();

  return (
    <AuthShell
      title="Log in"
      description={
        <p className="text-sm text-secondary">
          New here?{" "}
          <Link href={signupHref} className="text-accent hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <RoleSelector
          value={role}
          onChange={setRole}
          hint="Required for first-time social sign-in."
        />
        <SocialAuthButtons
          onGoogle={handleGoogleLogin}
          onFacebook={handleFacebookLogin}
          disabled={loading || !role}
        />

        <AuthDivider />

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="text-sm text-error">{error}</p>}
          {needsEmailVerification && (
            <EmailVerificationAlert
              onResend={handleResendVerification}
              resendLoading={resendLoading}
              resendMessage={resendMessage}
            />
          )}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-primary">Email</label>
            <input
              type="email"
              className={AUTH_INPUT_CLASS_NAME}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-primary">
              Password
            </label>
            <input
              type="password"
              className={AUTH_INPUT_CLASS_NAME}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-accent hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={AUTH_SUBMIT_BUTTON_CLASS_NAME}
          >
            {loading ? "Logging in..." : "Log in"}
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
  );
};
