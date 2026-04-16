import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-border bg-white">
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
