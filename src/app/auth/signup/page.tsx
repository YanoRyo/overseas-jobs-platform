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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      alert("すべての項目を入力してください");
      return;
    }

    if (password !== confirmPassword) {
      alert("パスワードが一致しません");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert("登録に失敗しました: " + error.message);
      return;
    }

    alert("確認メールを送信しました。メールをご確認ください。");

    const pendingReservation = localStorage.getItem("pendingReservation");
    if (pendingReservation) {
      router.push("/checkout");
      return;
    }

    router.push(redirect);
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-16 border rounded-md shadow-md">
      {/* トップページに戻る矢印 */}
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

      <h1 className="text-4xl font-bold mb-8 text-center">Sign Up</h1>

      {/* Socialログイン */}
      <div className="flex flex-col gap-4 mb-6">
        <button
          onClick={() => alert("Social login with Google clicked")}
          className="bg-red-500 text-white py-2 rounded-md hover:bg-red-600"
        >
          Continue with Google
        </button>
        <button
          onClick={() => alert("Social login with Facebook clicked")}
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

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block mb-1 font-semibold">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="w-full border border-gray-300 rounded-md p-2"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {/* Remember Me */}
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
          className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}
