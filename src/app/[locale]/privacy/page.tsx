import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { PRIVACY_SECTION_CONFIG } from "@/features/legal/config";
import { formatLastUpdated } from "@/features/legal/formatLastUpdated";

type PrivacyPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legalPages.privacy" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legalPages.privacy" });
  const tShared = await getTranslations({
    locale,
    namespace: "legalPages.shared",
  });

  const sections = PRIVACY_SECTION_CONFIG.map((section) => ({
    id: section.id,
    title: t(`sections.${section.id}.title`),
    paragraphs: Array.from({ length: section.paragraphCount }, (_, index) =>
      t(`sections.${section.id}.paragraphs.${index + 1}`)
    ),
    bullets: section.bulletCount
      ? Array.from({ length: section.bulletCount }, (_, index) =>
          t(`sections.${section.id}.bullets.${index + 1}`)
        )
      : undefined,
  }));

  return (
    <LegalDocumentPage
      eyebrow={tShared("label")}
      title={t("pageTitle")}
      description={t("pageDescription")}
      lastUpdated={tShared("lastUpdated", {
        date: formatLastUpdated(locale),
      })}
      sections={sections}
    />
  );
}
