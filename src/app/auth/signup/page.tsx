"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // =========================
  // Email/Password サインアップ
  // =========================
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      alert("すべての項目を入力してください");
      return;
    }
    if (password !== confirmPassword) {
      alert("パスワードが一致しません");
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert("登録に失敗しました: " + error.message);
      return;
    }

    const user = data.user;
    if (user) {
      // public.users に追加
      const { error: insertError } = await supabase.from("users").upsert([
        {
          id: user.id,
          username: user.email?.split("@")[0] ?? "no-name",
          role: "student",
        },
      ]);
      if (insertError)
        console.error("public.users へのINSERT失敗:", insertError);
    }

    alert("確認メールを送信しました。メールをご確認ください。");
    const pendingReservation = localStorage.getItem("pendingReservation");
    router.push(pendingReservation ? "/checkout" : redirect);
  };

  // =========================
  // Google OAuth
  // =========================
  const handleGoogleSignIn = async () => {
    console.log("🌐 Google SignIn 開始");
    console.log("window.location.origin:", window.location.origin);
    console.log("redirect param:", redirect);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });
    if (error) console.error("Google OAuth エラー:", error);
  };

  // =========================
  // Facebook OAuth
  // =========================
  const handleFacebookSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });
    if (error) console.error("Facebook OAuth エラー:", error);
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-16 border border-border rounded-md shadow bg-surface">
      <div className="mb-4">
        <button
          onClick={() => router.push("/")}
          aria-label="Go back to home"
          className="text-2xl hover:text-secondary transition-colors"
          style={{ lineHeight: 1 }}
        >
          ←
        </button>
      </div>

      <h1 className="text-4xl font-bold mb-8 text-center">Sign Up</h1>

      {/* Socialログイン */}
      <div className="flex flex-col gap-4 mb-6">
        <button
          onClick={handleGoogleSignIn}
          className="bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-colors"
        >
          Continue with Google
        </button>
        <button
          onClick={handleFacebookSignIn}
          className="bg-blue-700 text-white py-2 rounded-md hover:bg-blue-800 transition-colors"
        >
          Continue with Facebook
        </button>
      </div>

      {/* or Divider */}
      <div className="flex items-center mb-6">
        <div className="flex-grow border-t border-border"></div>
        <span className="mx-4 text-muted font-semibold">or</span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      {/* Email/Password 登録フォーム */}
      <form onSubmit={handleEmailSignUp} className="space-y-6">
        <div>
          <label htmlFor="email" className="block mb-1 font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full border border-border hover:border-border-hover rounded-md p-2 bg-surface text-primary transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block mb-1 font-semibold">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full border border-border hover:border-border-hover rounded-md p-2 bg-surface text-primary transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block mb-1 font-semibold">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="w-full border border-border hover:border-border-hover rounded-md p-2 bg-surface text-primary transition-colors"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
            className="h-4 w-4"
          />
          <label htmlFor="rememberMe" className="select-none">
            Remember Me
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-accent text-white py-3 rounded-md font-semibold hover:bg-accent-hover transition-colors"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}
