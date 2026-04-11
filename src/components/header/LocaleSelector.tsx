"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
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
  const router = useRouter();
  const pathname = usePathname();
  const { currency, setCurrency } = useCurrency();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const currentLanguage =
    LANGUAGE_OPTIONS.find((l) => l.code === locale)?.label ?? "English";
  const currentCurrency = currency;

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
    setOpen(false);
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
        aria-label="Language and currency"
      >
        <span>
          {currentLanguage}, {currentCurrency}
        </span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#e4e7ee] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
          {/* Language Section */}
          <div className="px-4 pt-4 pb-2">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#7a8094]">
              {locale === "ja" ? "言語" : "Language"}
            </div>
            <div className="space-y-1">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    locale === lang.code
                      ? "bg-[#f4f6fb] font-semibold text-[#1f1f2d]"
                      : "text-[#1f1f2d] hover:bg-[#f7f8fc]"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mx-4 border-t border-[#e6e8ef]" />

          {/* Currency Section */}
          <div className="px-4 pt-2 pb-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#7a8094]">
              {locale === "ja" ? "通貨" : "Currency"}
            </div>
            <div className="space-y-1">
              {CURRENCIES.map((cur) => (
                <button
                  key={cur.code}
                  type="button"
                  onClick={() => handleCurrencyChange(cur.code)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    currency === cur.code
                      ? "bg-[#f4f6fb] font-semibold text-[#1f1f2d]"
                      : "text-[#1f1f2d] hover:bg-[#f7f8fc]"
                  }`}
                >
                  {cur.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
