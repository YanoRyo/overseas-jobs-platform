import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { SetHtmlLang } from "@/components/SetHtmlLang";
import { Footer } from "@/components/footer/Footer";
import { Header } from "@/components/header/Header";
import { AuthModalProvider } from "@/features/auth/context/AuthModalProvider";
import { FavoritesProvider } from "@/features/favorites/context/FavoritesContext";
import { SupabaseProvider } from "@/components/SupabaseProvider";
import { CurrencyProvider } from "@/features/currency/context/CurrencyContext";
import { getMessages } from "@/i18n/messages";
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

  const messages = getMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SetHtmlLang />
      <CurrencyProvider>
        <SupabaseProvider>
          <AuthModalProvider>
            <FavoritesProvider>
              <div className="flex min-h-screen flex-col bg-background">
                <Header />
                <div className="flex-1">{children}</div>
                <Footer />
              </div>
            </FavoritesProvider>
          </AuthModalProvider>
        </SupabaseProvider>
      </CurrencyProvider>
    </NextIntlClientProvider>
  );
}
