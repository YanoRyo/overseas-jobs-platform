"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSocialLogin = (provider: string) => {
    alert(`Social login with ${provider} clicked`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Emailを入力してください");
      return;
    }
    if (!password) {
      setError("Passwordを入力してください");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // ログイン成功時

    // 例えばrememberMeでセッションの永続化を制御したい場合、supabase側で設定可能（ただし基本はSupabaseが自動管理）

    // redirect先取得
    const searchParams = new URLSearchParams(window.location.search);
    let redirectTo = searchParams.get("redirect") || "/";

    // 相対パス対策: redirect=checkout → /checkout に補正
    if (redirectTo && !redirectTo.startsWith("/")) {
      redirectTo = "/" + redirectTo;
    }

    // pendingReservation があれば優先してリダイレクト
    const pendingReservation = localStorage.getItem("pendingReservation");
    if (pendingReservation && redirectTo === "/checkout") {
      router.push("/checkout");
      return;
    }

    router.push(redirectTo);
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-16 border rounded-md shadow-md">
      {/* 戻るボタン */}
      <div className="mb-4">
        <button
          onClick={() => router.push("/")}
          aria-label="Go back to home"
          className="text-2xl hover:text-gray-600"
          style={{ lineHeight: 1 }}
        >
          ←
        </button>
      </div>

      <h1 className="text-4xl font-bold mb-8 text-center">Login</h1>

      {/* Socialログイン */}
      <div className="flex flex-col gap-4 mb-6">
        <button
          onClick={() => handleSocialLogin("Google")}
          className="bg-red-500 text-white py-2 rounded-md hover:bg-red-600"
        >
          Continue with Google
        </button>
        <button
          onClick={() => handleSocialLogin("Facebook")}
          className="bg-blue-700 text-white py-2 rounded-md hover:bg-blue-800"
        >
          Continue with Facebook
        </button>
      </div>

      {/* or Divider */}
      <div className="flex items-center mb-6">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="mx-4 text-gray-500 font-semibold">or</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-500">{error}</p>}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block mb-1 font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full border border-gray-300 rounded-md p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block mb-1 font-semibold">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full border border-gray-300 rounded-md p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Forget passwordリンク */}
        <div className="text-right">
          <a
            href="/auth/forgot-password"
            className="text-sm text-blue-600 hover:underline"
          >
            Forget your password?
          </a>
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe((prev) => !prev)}
            className="h-4 w-4"
          />
          <label htmlFor="rememberMe" className="select-none">
            Remember Me
          </label>
        </div>

        {/* Loginボタン */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-md font-semibold text-white ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* ポリシーリンク・テキスト */}
      <p className="mt-6 text-center text-sm text-gray-600">
        By logging in, you agree to our{" "}
        <a href="/policy" className="text-blue-600 hover:underline">
          Terms & Policy
        </a>
        .
      </p>
    </div>
  );
}
