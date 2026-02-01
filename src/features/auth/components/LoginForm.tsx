"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLogin } from "../hooks/useLogin";

export const LoginForm = () => {
  const router = useRouter();
  const sp = useSearchParams();

  const role = useMemo(() => {
    const r = sp.get("role");
    return (r === "mentor" ? "mentor" : "student") as "mentor" | "student";
  }, [sp]);

  const {
    email,
    password,
    loading,
    error,
    setEmail,
    setPassword,
    handleSubmit,
  } = useLogin({ role });

  // Socialは未実装なので、押されたら「準備中」だけ出す
  const [socialInfo, setSocialInfo] = useState<string | null>(null);

  const title = role === "mentor" ? "Mentor Login" : "Student Login";

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

      <h1 className="text-4xl font-bold mb-8 text-center">{title}</h1>

      {/* Socialログイン */}
      <div className="flex flex-col gap-4 mb-2">
        <button
          type="button"
          onClick={() => setSocialInfo("Googleログインは準備中です")}
          className="bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-colors"
        >
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => setSocialInfo("Facebookログインは準備中です")}
          className="bg-blue-700 text-white py-2 rounded-md hover:bg-blue-800 transition-colors"
        >
          Continue with Facebook
        </button>

        {socialInfo && (
          <p className="text-xs text-gray-500 text-center">{socialInfo}</p>
        )}
      </div>

      {/* or */}
      <div className="flex items-center mb-6">
        <div className="flex-grow border-t border-gray-300" />
        <span className="mx-4 text-gray-500 font-semibold">or</span>
        <div className="flex-grow border-t border-gray-300" />
      </div>

      {/* Email/Passwordログインフォーム */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-500">{error}</p>}

        <div>
          <label className="block mb-1 font-semibold">Email</label>
          <input
            className="w-full border border-gray-300 rounded-md p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Password</label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-md p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="text-right">
          <a
            href="/auth/forgot-password"
            className="text-sm text-blue-600 hover:underline"
          >
            Forget your password?
          </a>
        </div>

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

      <p className="mt-6 text-center text-sm text-gray-600">
        By logging in, you agree to our{" "}
        <a href="/policy" className="text-blue-600 hover:underline">
          Terms & Policy
        </a>
        .
      </p>
    </div>
  );
};
