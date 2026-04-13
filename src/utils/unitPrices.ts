import type { LivePricesUsd } from "../services/prices/priceService";

export type UnitPricesUsd = {
  BTC: number;
  ETH: number;
  USDT: number;
  XRP: number;
};

export function buildUnitPrices(spot: LivePricesUsd, xrpUsd: number): UnitPricesUsd {
  return {
    BTC: spot.BTC > 0 ? spot.BTC : 0,
    ETH: spot.ETH > 0 ? spot.ETH : 0,
    USDT: spot.USDT > 0 ? spot.USDT : 1,
    XRP: xrpUsd > 0 ? xrpUsd : 0,
  };
}

export function portfolioTotalUsd(
  holdings: { symbol: string; amount: number }[],
  unit: UnitPricesUsd
): number {
  const map: Record<string, number> = {
    BTC: unit.BTC,
    ETH: unit.ETH,
    USDT: unit.USDT,
    XRP: unit.XRP,
  };
  return holdings.reduce((sum, h) => sum + h.amount * (map[h.symbol] ?? 0), 0);
}
