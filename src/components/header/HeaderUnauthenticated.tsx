"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { PRIMARY_PILL_BUTTON_MEDIUM_CLASS_NAME } from "@/components/ui/buttonStyles";
import LocaleSelector from "./LocaleSelector";

export function HeaderUnauthenticated() {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const redirectPath = pathname || "/";

  return (
    <>
      <LocaleSelector />
      <Link
        href={`/auth/login?redirect=${encodeURIComponent(redirectPath)}`}
        className={PRIMARY_PILL_BUTTON_MEDIUM_CLASS_NAME}
      >
        {t("logIn")}
      </Link>
    </>
  );
}
