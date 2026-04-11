"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { ChevronDown } from "lucide-react";
import { useCurrency } from "@/features/currency/context/CurrencyContext";
import { CURRENCIES } from "@/features/currency/constants";
import type { CurrencyCode } from "@/features/currency/constants";
import type { Locale } from "@/i18n/config";

const LANGUAGE_OPTIONS: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
];

export default function LocaleSelector() {
  const locale = useLocale() as Locale;
  const t = useTranslations("locale");
  const router = useRouter();
  const pathname = usePathname();
  const { currency, setCurrency } = useCurrency();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const currentLanguage =
    LANGUAGE_OPTIONS.find((l) => l.code === locale)?.label ?? "English";

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const handleLanguageChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  const handleCurrencyChange = (code: CurrencyCode) => {
    setCurrency(code);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-[#455065] transition-colors hover:bg-[#f4f6fb]"
        aria-label={t("selectorLabel")}
      >
        <span>
          {currentLanguage}, {currency}
        </span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-[#e4e7ee] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
          {/* Language Section */}
          <div className="mb-3">
            <label htmlFor="locale-language-select" className="mb-1.5 block text-xs font-semibold text-[#7a8094]">
              {t("language")}
            </label>
            <div className="relative">
              <select
                id="locale-language-select"
                value={locale}
                onChange={(e) => handleLanguageChange(e.target.value as Locale)}
                className="w-full appearance-none rounded-lg border border-[#d1d5db] bg-white py-2 pr-8 pl-3 text-sm text-[#1f1f2d] focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-[#7a8094]" />
            </div>
          </div>

          {/* Currency Section */}
          <div>
            <label htmlFor="locale-currency-select" className="mb-1.5 block text-xs font-semibold text-[#7a8094]">
              {t("currency")}
            </label>
            <div className="relative">
              <select
                id="locale-currency-select"
                value={currency}
                onChange={(e) =>
                  handleCurrencyChange(e.target.value as CurrencyCode)
                }
                className="w-full appearance-none rounded-lg border border-[#d1d5db] bg-white py-2 pr-8 pl-3 text-sm text-[#1f1f2d] focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              >
                {CURRENCIES.map((cur) => (
                  <option key={cur.code} value={cur.code}>
                    {cur.code}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-[#7a8094]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
