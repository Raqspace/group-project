export type AlertSymbol = "BTC" | "ETH" | "USDT";

export type AlertDirection = "above" | "below";

export interface PriceAlert {
  id: string;
  userId: string;
  symbol: AlertSymbol;
  direction: AlertDirection;
  targetPrice: number;
  isActive: boolean;
  triggeredAt: string | null;
  createdAt: string;
}
