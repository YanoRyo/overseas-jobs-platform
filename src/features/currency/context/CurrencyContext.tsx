"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { CurrencyCode } from "../constants";
import { CURRENCIES, DEFAULT_CURRENCY, STORAGE_KEY } from "../constants";

type Rates = Record<string, number>;

const CACHE_KEY = "bridgee-exchange-rates";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type CachedRates = { rates: Rates; fetchedAt: number };

function loadCachedRates(): CachedRates | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedRates = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) return parsed;
  } catch {
    // ignore
  }
  return null;
}

function saveCachedRates(rates: Rates) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ rates, fetchedAt: Date.now() })
    );
  } catch {
    // ignore
  }
}

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  convertFromUSD: (amountUSD: number, target: CurrencyCode) => number | null;
  ratesLoading: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => {},
  convertFromUSD: () => null,
  ratesLoading: true,
});

function isValidCurrency(value: unknown): value is CurrencyCode {
  return CURRENCIES.some((c) => c.code === value);
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [rates, setRates] = useState<Rates>({});
  const [ratesLoading, setRatesLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isValidCurrency(stored)) {
      setCurrencyState(stored);
    }
  }, []);

  // 為替レートを1回だけfetch（全コンポーネントで共有）
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const cached = loadCachedRates();
    if (cached) {
      setRates(cached.rates);
      setRatesLoading(false);
      return;
    }

    const fetchRates = async () => {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await res.json();
        if (data.rates) {
          setRates(data.rates);
          saveCachedRates(data.rates);
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
      } finally {
        setRatesLoading(false);
      }
    };

    void fetchRates();
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const convertFromUSD = useCallback(
    (amountUSD: number, target: CurrencyCode): number | null => {
      if (target === "USD") return amountUSD;
      const rate = rates[target];
      if (!rate) return null;
      return Math.round(amountUSD * rate * 100) / 100;
    },
    [rates]
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, convertFromUSD, ratesLoading }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
