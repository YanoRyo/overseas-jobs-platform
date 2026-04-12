import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { SetHtmlLang } from "@/components/SetHtmlLang";
import { Header } from "@/components/header/Header";
import { FavoritesProvider } from "@/features/favorites/context/FavoritesContext";
import { SupabaseProvider } from "@/components/SupabaseProvider";
import { CurrencyProvider } from "@/features/currency/context/CurrencyContext";
import { routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: "Bridgeee",
    description: t("siteDescription"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SetHtmlLang />
      <CurrencyProvider>
        <SupabaseProvider>
          <FavoritesProvider>
            <Header />
            {children}
          </FavoritesProvider>
        </SupabaseProvider>
      </CurrencyProvider>
    </NextIntlClientProvider>
  );
}
