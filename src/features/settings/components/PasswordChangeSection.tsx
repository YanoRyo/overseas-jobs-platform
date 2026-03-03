"use client";

import { useChangePassword } from "../hooks/useChangePassword";

export function PasswordChangeSection() {
  const {
    currentPassword,
    newPassword,
    confirmPassword,
    loading,
    error,
    success,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    handleSubmit,
  } = useChangePassword();

  return (
    <form onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Current password
      </label>
      <input
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 mb-4"
        disabled={loading}
      />

      <label className="block text-sm font-medium text-gray-700 mb-1">
        New password
      </label>
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 mb-4"
        disabled={loading}
      />

      <label className="block text-sm font-medium text-gray-700 mb-1">
        Confirm new password
      </label>
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 mb-6"
        disabled={loading}
      />

      <div className="space-y-2">
        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-[10px] border-2 border-[#1d4ed8] bg-[#2563eb] text-lg font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Updating..." : "Change password"}
        </button>

        {error && <p className="text-sm text-error">{error}</p>}
        {success && (
          <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
            <p className="text-sm font-medium text-success">
              Password updated successfully.
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
