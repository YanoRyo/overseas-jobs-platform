"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSignup } from "../hooks/useSignup";
import { AuthShell } from "./AuthShell";
import { AuthDivider } from "./AuthDivider";
import { RoleSelector } from "./RoleSelector";
import { SocialAuthButtons } from "./SocialAuthButtons";

export const SignupForm = () => {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const loginHref = redirect
    ? `/auth/login?redirect=${encodeURIComponent(redirect)}`
    : "/auth/login";
  const {
    email,
    password,
    confirmPassword,
    role,
    rememberMe,
    loading,
    setEmail,
    setPassword,
    setConfirmPassword,
    setRole,
    setRememberMe,
    handleEmailSignup,
    handleGoogleSignup,
    handleFacebookSignup,
  } = useSignup();

  const inputClassName =
    "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
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

          <div className="space-y-2">
            <label className="text-sm font-semibold text-primary">
              Password
            </label>
            <input
              type="password"
              placeholder="Create a password"
              className={inputClassName}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-primary">
              Confirm password
            </label>
            <input
              type="password"
              placeholder="Confirm your password"
              className={inputClassName}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-secondary">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
            />
            Remember me
          </label>

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
  );
};
