import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { LEGAL_NOTICE_SECTION_CONFIG } from "@/features/legal/config";
import { formatLastUpdated } from "@/features/legal/formatLastUpdated";

type LegalNoticePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LegalNoticePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legalPages.legal" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function LegalNoticePage({
  params,
}: LegalNoticePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legalPages.legal" });
  const tl = await getTranslations({ locale, namespace: "legal" });
  const tShared = await getTranslations({
    locale,
    namespace: "legalPages.shared",
  });

  const sections = LEGAL_NOTICE_SECTION_CONFIG.map((section) => ({
    id: section.id,
    title: t(`sections.${section.id}.title`),
    paragraphs: Array.from({ length: section.paragraphCount }, (_, index) => {
      if (section.id === "seller" && index === 1) {
        return tl("operator");
      }

      return t(`sections.${section.id}.paragraphs.${index + 1}`);
    }),
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
