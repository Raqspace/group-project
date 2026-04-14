export function buildUnitPrices(spot, xrpUsd) {
    return {
        BTC: spot.BTC > 0 ? spot.BTC : 0,
        ETH: spot.ETH > 0 ? spot.ETH : 0,
        USDT: spot.USDT > 0 ? spot.USDT : 1,
        XRP: xrpUsd > 0 ? xrpUsd : 0,
    };
}
export function portfolioTotalUsd(holdings, unit) {
    const map = {
        BTC: unit.BTC,
        ETH: unit.ETH,
        USDT: unit.USDT,
        XRP: unit.XRP,
    };
    return holdings.reduce((sum, h) => sum + h.amount * (map[h.symbol] ?? 0), 0);
}
