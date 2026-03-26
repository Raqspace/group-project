export type LivePricesUsd = {
  BTC: number;
  ETH: number;
  USDT: number;
};

export type LivePriceChanges24h = {
  BTC: number;
  ETH: number;
  USDT: number;
};

type CoinGeckoResponse = {
  bitcoin?: { usd?: number; usd_24h_change?: number };
  ethereum?: { usd?: number; usd_24h_change?: number };
  tether?: { usd?: number; usd_24h_change?: number };
};

const COINGECKO_SIMPLE_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd&include_24hr_change=true";

export type LivePriceSnapshot = {
  prices: LivePricesUsd;
  changes24h: LivePriceChanges24h;
};

// Calls CoinGecko's simple price endpoint and extracts BTC/ETH/USDT USD prices + 24h changes.
export async function getLivePricesUsd(): Promise<LivePriceSnapshot> {
  const response = await fetch(COINGECKO_SIMPLE_PRICE_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch live prices");
  }

  const payload = (await response.json()) as CoinGeckoResponse;

  const btc = payload.bitcoin?.usd;
  const eth = payload.ethereum?.usd;
  const usdt = payload.tether?.usd;
  const btcChange = payload.bitcoin?.usd_24h_change;
  const ethChange = payload.ethereum?.usd_24h_change;
  const usdtChange = payload.tether?.usd_24h_change;

  if (typeof btc !== "number" || typeof eth !== "number" || typeof usdt !== "number") {
    throw new Error("Invalid live price response");
  }

  return {
    prices: {
      BTC: btc,
      ETH: eth,
      USDT: usdt,
    },
    changes24h: {
      BTC: typeof btcChange === "number" ? btcChange : 0,
      ETH: typeof ethChange === "number" ? ethChange : 0,
      USDT: typeof usdtChange === "number" ? usdtChange : 0,
    },
  };
}
