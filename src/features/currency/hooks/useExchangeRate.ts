"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CurrencyCode } from "../constants";

type Rates = Record<string, number>;

const CACHE_KEY = "bridgee-exchange-rates";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type CachedRates = {
  rates: Rates;
  fetchedAt: number;
};

function loadCachedRates(): CachedRates | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedRates = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
      return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

function saveCachedRates(rates: Rates) {
  try {
    const cached: CachedRates = { rates, fetchedAt: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // ignore storage errors
  }
}

export function useExchangeRates() {
  const [rates, setRates] = useState<Rates>({});
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const cached = loadCachedRates();
    if (cached) {
      setRates(cached.rates);
      setLoading(false);
      return;
    }

    const fetchRates = async () => {
      try {
        const res = await fetch(
          "https://open.er-api.com/v6/latest/USD"
        );
        const data = await res.json();
        if (data.rates) {
          setRates(data.rates);
          saveCachedRates(data.rates);
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchRates();
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

  return { rates, loading, convertFromUSD };
}
