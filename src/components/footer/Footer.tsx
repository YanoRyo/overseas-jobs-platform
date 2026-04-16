"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const locale = useLocale();
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border bg-white" data-locale={locale}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-6 py-6 text-center text-xs text-muted sm:flex-row sm:gap-6">
        <Link
          href="/terms"
          className="transition-colors hover:text-primary hover:underline"
        >
          {t("terms")}
        </Link>
        <Link
          href="/privacy"
          className="transition-colors hover:text-primary hover:underline"
        >
          {t("privacy")}
        </Link>
        <Link
          href="/legal"
          className="transition-colors hover:text-primary hover:underline"
        >
          {t("legal")}
        </Link>
      </div>
    </footer>
  );
}
