"use client";

import { useTranslations } from "next-intl";
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
  label,
  hint,
}: RoleSelectorProps) => {
  const t = useTranslations("auth.role");
  const resolvedLabel = label ?? t("chooseRole");
  const resolvedHint = hint ?? t("requiredHint");

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-primary">
        {resolvedLabel}
      </legend>
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
          {t("student")}
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
          {t("mentor")}
        </label>
      </div>
      <p className="text-xs text-muted">{resolvedHint}</p>
    </fieldset>
  );
};
