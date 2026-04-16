import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { formatLastUpdated } from "@/features/legal/formatLastUpdated";

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const tShared = await getTranslations({
    locale,
    namespace: "legalPages.shared",
  });

  return (
    <LegalPageShell
      eyebrow={t("eyebrow")}
      title={t("pageTitle")}
      description={t("pageDescription")}
      lastUpdated={tShared("lastUpdated", {
        date: formatLastUpdated(locale),
      })}
    >
      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-primary sm:text-xl">
          {t("serviceScopeTitle")}
        </h2>
        <p className="mt-4 text-sm leading-7 text-secondary">
          {t("notJobService")}
        </p>
      </section>
    </LegalPageShell>
  );
}
