import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { POLICY_CARD_CONFIG } from "@/features/legal/config";
import { formatLastUpdated } from "@/features/legal/formatLastUpdated";

type PolicyPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PolicyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "policy" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "policy" });
  const tShared = await getTranslations({
    locale,
    namespace: "legalPages.shared",
  });

  return (
    <LegalPageShell
      eyebrow={tShared("label")}
      title={t("pageTitle")}
      description={t("pageDescription")}
      lastUpdated={tShared("lastUpdated", {
        date: formatLastUpdated(locale),
      })}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {POLICY_CARD_CONFIG.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-border-hover hover:bg-surface-hover"
          >
            <h2 className="text-lg font-semibold text-primary">
              {t(`cards.${card.id}.title`)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              {t(`cards.${card.id}.description`)}
            </p>
          </Link>
        ))}
      </div>
    </LegalPageShell>
  );
}
