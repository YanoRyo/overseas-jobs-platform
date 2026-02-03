"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLogin } from "../hooks/useLogin";
import { AuthShell } from "./AuthShell";
import { AuthDivider } from "./AuthDivider";
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
    role,
    setEmail,
    setPassword,
    setRole,
    handleSubmit,
    handleGoogleLogin,
    handleFacebookLogin,
  } = useLogin();

  const inputClassName =
    "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-blue-200";

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
          <div className="space-y-2">
            <label className="text-sm font-semibold text-primary">Email</label>
            <input
              type="email"
              className={inputClassName}
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
              className={inputClassName}
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
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
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
