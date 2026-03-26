import { useEffect, useState } from "react";
import { getLivePricesUsd, } from "../services/prices/priceService";
const FALLBACK_PRICES = {
    BTC: 67800,
    ETH: 3250,
    USDT: 1,
};
const FALLBACK_CHANGES = {
    BTC: 0,
    ETH: 0,
    USDT: 0,
};
// Fetches live CoinGecko prices and refreshes them every 30 seconds.
export function useLivePrices() {
    const [prices, setPrices] = useState(FALLBACK_PRICES);
    const [changes24h, setChanges24h] = useState(FALLBACK_CHANGES);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        const loadPrices = async () => {
            try {
                const snapshot = await getLivePricesUsd();
                if (!active)
                    return;
                setPrices(snapshot.prices);
                setChanges24h(snapshot.changes24h);
                setLastUpdated(new Date());
                setError("");
            }
            catch {
                if (!active)
                    return;
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
