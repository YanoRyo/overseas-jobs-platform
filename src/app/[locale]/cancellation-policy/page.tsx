import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { CANCELLATION_POLICY_SECTION_CONFIG } from "@/features/legal/config";
import { formatLastUpdated } from "@/features/legal/formatLastUpdated";

type CancellationPolicyPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: CancellationPolicyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "legalPages.cancellation",
  });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function CancellationPolicyPage({
  params,
}: CancellationPolicyPageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "legalPages.cancellation",
  });
  const tShared = await getTranslations({
    locale,
    namespace: "legalPages.shared",
  });

  const sections = CANCELLATION_POLICY_SECTION_CONFIG.map((section) => ({
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
