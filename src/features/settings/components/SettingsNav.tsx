"use client";

export function SettingsNav({
  active,
  onChange,
}: {
  active: "account";
  onChange: (v: "account") => void;
}) {
  return (
    <nav className="w-64 flex-shrink-0">
      <div className="text-sm font-semibold text-gray-900 mb-4">Settings</div>

      <button
        type="button"
        onClick={() => onChange("account")}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
          active === "account"
            ? "bg-gray-100 font-semibold"
            : "hover:bg-gray-50 text-gray-700"
        }`}
      >
        Account
      </button>
    </nav>
  );
}
