"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { PRIMARY_PILL_BUTTON_MEDIUM_CLASS_NAME } from "@/components/ui/buttonStyles";
import { Link, usePathname } from "@/i18n/navigation";
import LocaleSelector from "./LocaleSelector";

export function HeaderUnauthenticated() {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loginHref = useMemo(() => {
    const query = searchParams.toString();
    const currentPath = pathname ? `${pathname}${query ? `?${query}` : ""}` : "/";

    return `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
  }, [pathname, searchParams]);

  return (
    <>
      <LocaleSelector />
      <Link
        href={loginHref}
        className={PRIMARY_PILL_BUTTON_MEDIUM_CLASS_NAME}
      >
        {t("logIn")}
      </Link>
    </>
  );
}
