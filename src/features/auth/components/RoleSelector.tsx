"use client";

import type { UserRole } from "../types";

type RoleSelectorProps = {
  value: UserRole | null;
  onChange: (role: UserRole) => void;
  label?: string;
  hint?: string;
};

export const RoleSelector = ({
  value,
  onChange,
  label = "Choose your role",
  hint = "Required for social sign-in.",
}: RoleSelectorProps) => {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-primary">{label}</legend>
      <div className="grid grid-cols-2 gap-3" role="radiogroup">
        <label
          className={`flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition ${
            value === "student"
              ? "border-accent bg-blue-50 text-accent"
              : "border-border text-secondary hover:border-border/80"
          }`}
        >
          <input
            type="radio"
            name="role"
            value="student"
            checked={value === "student"}
            onChange={() => onChange("student")}
            className="sr-only"
          />
          Student
        </label>
        <label
          className={`flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition ${
            value === "mentor"
              ? "border-accent bg-blue-50 text-accent"
              : "border-border text-secondary hover:border-border/80"
          }`}
        >
          <input
            type="radio"
            name="role"
            value="mentor"
            checked={value === "mentor"}
            onChange={() => onChange("mentor")}
            className="sr-only"
          />
          Mentor
        </label>
      </div>
      <p className="text-xs text-muted">{hint}</p>
    </fieldset>
  );
};
