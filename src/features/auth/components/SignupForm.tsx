"use client";
import { useRouter } from "next/navigation";
import { useSignup } from "../hooks/useSignup";

export const SignupForm = () => {
  const router = useRouter();
  const {
    email,
    password,
    confirmPassword,
    rememberMe,
    loading,
    setEmail,
    setPassword,
    setConfirmPassword,
    setRememberMe,
    handleEmailSignup,
    handleGoogleSignup,
    handleFacebookSignup,
  } = useSignup();

  return (
    <div className="max-w-md mx-auto p-6 mt-16 border rounded-md shadow-md">
      <div className="mb-4">
        <button
          onClick={() => router.push("/")}
          aria-label="Go back"
          className="text-2xl hover:text-gray-600"
          style={{ lineHeight: 1 }}
        >
          ←
        </button>
      </div>
      <h1 className="text-4xl font-bold mb-8 text-center">Sign Up</h1>

      {/* Social */}
      <div className="flex flex-col gap-4 mb-6">
        <button
          onClick={handleGoogleSignup}
          className="bg-red-500 text-white py-2 rounded-md"
        >
          Continue with Google
        </button>
        <button
          onClick={handleFacebookSignup}
          className="bg-blue-700 text-white py-2 rounded-md"
        >
          Continue with Facebook
        </button>
      </div>

      <form onSubmit={handleEmailSignup} className="space-y-6">
        <input
          type="email"
          placeholder="Email"
          className="w-full border border-gray-300 rounded-md p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border border-gray-300 rounded-md p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full border border-gray-300 rounded-md p-2"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
          />
          Remember Me
        </label>

        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-md"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};
