"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSocialLogin = (provider: string) => {
    alert(`Social login with ${provider} clicked`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      alert("Emailを入力してください");
      return;
    }
    if (!password) {
      alert("Passwordを入力してください");
      return;
    }

    // 仮ログイン処理
    localStorage.setItem("user", email);

    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = searchParams.get("redirect") || "/";

    // ✅ pendingReservation がある場合は checkout に優先リダイレクト
    const pendingReservation = localStorage.getItem("pendingReservation");
    if (pendingReservation && redirectTo === "/checkout") {
      router.push("/checkout");
      return;
    }

    // 通常リダイレクト
    router.push(redirectTo);
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-16 border rounded-md shadow-md">
      {/* 矢印アイコン（タイトル上の左端） */}
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

      {/* タイトル中央 */}
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
          className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700"
        >
          Login
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
