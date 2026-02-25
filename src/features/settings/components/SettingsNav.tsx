"use client";

export function SettingsNav({
  active,
  onChange,
}: {
  active: "account";
  onChange: (v: "account") => void;
}) {
  const selected = active === "account";

  return (
    <nav className="mt-4 w-56">
      <ul className="space-y-3">
        <li>
          <button
            type="button"
            onClick={() => onChange("account")}
            className={`relative w-full pl-4 text-left text-[18px] font-medium transition ${
              selected
                ? "text-[#1f1f2d]"
                : "text-[#52576a] hover:text-[#1f1f2d]"
            }`}
          >
            {selected && (
              <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 bg-[#2563eb]" />
            )}
            Account
          </button>
        </li>
      </ul>
    </nav>
  );
}
