export type HoldingView = {
  symbol: "BTC" | "ETH" | "USDT";
  name: string;
  amount: number;
  usdValue: number;
  change24h: number;
};
