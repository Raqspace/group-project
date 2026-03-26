import { useEffect, useState } from "react";
import {
  getLivePricesUsd,
  type LivePriceChanges24h,
  type LivePricesUsd,
} from "../services/prices/priceService";

const FALLBACK_PRICES: LivePricesUsd = {
  BTC: 67800,
  ETH: 3250,
  USDT: 1,
};

const FALLBACK_CHANGES: LivePriceChanges24h = {
  BTC: 0,
  ETH: 0,
  USDT: 0,
};

// Fetches live CoinGecko prices and refreshes them every 30 seconds.
export function useLivePrices() {
  const [prices, setPrices] = useState<LivePricesUsd>(FALLBACK_PRICES);
  const [changes24h, setChanges24h] = useState<LivePriceChanges24h>(FALLBACK_CHANGES);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadPrices = async () => {
      try {
        const snapshot = await getLivePricesUsd();
        if (!active) return;
        setPrices(snapshot.prices);
        setChanges24h(snapshot.changes24h);
        setLastUpdated(new Date());
        setError("");
      } catch {
        if (!active) return;
        setError("Live API unavailable. Showing fallback prices.");
      }
    };

    loadPrices();
    const timer = window.setInterval(loadPrices, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return { prices, changes24h, lastUpdated, error };
}
