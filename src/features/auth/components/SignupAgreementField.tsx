"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type SignupAgreementFieldProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
};

export function SignupAgreementField({
  checked,
  onChange,
  id,
}: SignupAgreementFieldProps) {
  const t = useTranslations("auth");
  const checkboxId = id ?? useId();
  const descriptionId = `${checkboxId}-description`;

  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-border bg-[#fafafb] p-4 text-sm leading-6 text-secondary"
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        required
        aria-describedby={descriptionId}
        className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-2 focus:ring-blue-200"
      />
      <span id={descriptionId}>
        {t("agreePrefix")}
        <Link href="/terms" className="text-accent hover:underline">
          {t("terms")}
        </Link>
        {t("and")}
        <Link href="/privacy" className="text-accent hover:underline">
          {t("privacy")}
        </Link>
        {t("agreeSuffix")}
      </span>
    </div>
  );
}
