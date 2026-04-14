import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { BtcSparkline7d, PortfolioAllocationBar } from "../components/dashboard/DashboardCharts";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { supabase } from "../services/supabaseClient";
import { useListenTour } from "../utils/tourBus";
import { portfolioTotalUsd } from "../utils/unitPrices";
const formatUsd = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const SPOT_SYMBOLS = ["BTC", "ETH", "USDT"];
function downsamplePrices(points, maxPoints) {
    if (points.length <= maxPoints)
        return points;
    const step = points.length / maxPoints;
    const out = [];
    for (let i = 0; i < maxPoints; i++) {
        const idx = Math.min(Math.floor(i * step), points.length - 1);
        out.push(points[idx]);
    }
    return out;
}
function unitToPriceMap(u) {
    return { BTC: u.BTC, ETH: u.ETH, XRP: u.XRP, USDT: u.USDT };
}
export function DashboardPage({ prices, unitPrices, lastUpdated, priceError }) {
    const statRef = useRef(null);
    const chartRef = useRef(null);
    const holdingsRef = useRef(null);
    const [userId, setUserId] = useState();
    const [holdings, setHoldings] = useState([]);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [btcSeries, setBtcSeries] = useState([]);
    const [btcChartLoading, setBtcChartLoading] = useState(true);
    const [btcChartError, setBtcChartError] = useState("");
    const priceMapForHoldings = unitToPriceMap(unitPrices);
    const totalUsd = portfolioTotalUsd(holdings, unitPrices);
    useEffect(() => {
        let cancelled = false;
        const loadHoldings = async () => {
            setDashboardLoading(true);
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user || cancelled) {
                setDashboardLoading(false);
                return;
            }
            const { data: walletData } = await supabase.from("Wallet").select("id").eq("user_id", user.id).single();
            if (!walletData || cancelled) {
                setHoldings([]);
                setDashboardLoading(false);
                return;
            }
            const { data: rows } = await supabase.from("holdings").select("id, symbol, amount").eq("wallet_id", walletData.id);
            if (!cancelled && rows) {
                setHoldings(rows);
            }
            if (!cancelled)
                setDashboardLoading(false);
        };
        const loadBtcChart = async () => {
            setBtcChartLoading(true);
            setBtcChartError("");
            try {
                const res = await fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7");
                if (!res.ok)
                    throw new Error("Chart request failed");
                const j = await res.json();
                const raw = j.prices ?? [];
                if (!cancelled) {
                    setBtcSeries(downsamplePrices(raw, 72));
                }
            }
            catch {
                if (!cancelled) {
                    setBtcChartError("Could not load 7 day BTC chart.");
                    setBtcSeries([]);
                }
            }
            finally {
                if (!cancelled)
                    setBtcChartLoading(false);
            }
        };
        loadHoldings();
        loadBtcChart();
        return () => {
            cancelled = true;
        };
    }, []);
    const tour = useWalkthroughTour();
    const startTour = useCallback(() => tour.start(), [tour.start]);
    useListenTour("dashboard", startTour);
    return (_jsxs(_Fragment, { children: [_jsxs("section", { ref: statRef, className: "stat-row card", children: [_jsxs("article", { className: "stat-card", children: [_jsx("p", { children: "Portfolio total (USD)" }), _jsx("strong", { children: dashboardLoading ? "…" : totalUsd > 0 ? formatUsd(totalUsd) : "—" }), _jsx("p", { style: { margin: "0.45rem 0 0", fontSize: "0.78rem", color: "#656663", fontWeight: 500 }, children: "Sum of every coin below \u00D7 today\u2019s USD price. Same math as Portfolio." })] }), SPOT_SYMBOLS.map((symbol) => (_jsxs("article", { className: "stat-card", children: [_jsxs("p", { children: [symbol, " market price"] }), _jsx("strong", { children: formatUsd(prices[symbol]) }), _jsx("p", { style: { margin: "0.45rem 0 0", fontSize: "0.75rem", color: "#8a8a85" }, children: "Public quote only. Not added into your total again." })] }, symbol)))] }), _jsxs("section", { className: "middle-row", children: [_jsxs("article", { ref: chartRef, className: "main-panel card", children: [_jsx("h3", { children: "How your coins split (and a BTC price graph)" }), _jsxs("p", { className: "live-note", style: { marginTop: 0, marginBottom: 12 }, children: ["The ", _jsx("strong", { children: "colored bar" }), " is ", _jsx("em", { children: "your" }), " simulator holdings only. The ", _jsx("strong", { children: "orange line" }), " is Bitcoin\u2019s price on the open market over the last week. That line is for learning what charts look like. It is not your balance and it does not change when you press Send."] }), dashboardLoading ? (_jsx("p", { className: "live-note", children: "Loading your holdings\u2026" })) : (_jsx(PortfolioAllocationBar, { holdings: holdings, prices: priceMapForHoldings })), _jsx(BtcSparkline7d, { points: btcSeries, loading: btcChartLoading, error: btcChartError }), _jsx("p", { className: "live-note", style: { marginTop: 12 }, children: lastUpdated ? `App price feed updated ${lastUpdated.toLocaleTimeString()}` : "Loading live prices..." }), priceError ? _jsx("p", { className: "live-error", children: priceError }) : null] }), _jsxs("article", { ref: holdingsRef, className: "side-panel card", children: [_jsx("h3", { children: "Holdings (same rows as Portfolio)" }), _jsx("p", { style: { margin: "0 0 10px", fontSize: "0.82rem", color: "#656663" }, children: "Left: how many coins you own. Right: that stack in USD (amount \u00D7 price). Add the right column: it equals Portfolio total." }), dashboardLoading ? (_jsx("p", { className: "live-note", children: "Loading\u2026" })) : holdings.length === 0 ? (_jsx("p", { className: "live-note", children: "No wallet yet. Create one under Wallet." })) : (_jsxs(_Fragment, { children: [_jsx("ul", { style: { margin: 0, padding: 0, listStyle: "none" }, children: holdings.map((h) => {
                                            const px = priceMapForHoldings[h.symbol] ?? 0;
                                            const usd = h.amount * px;
                                            return (_jsxs("li", { style: {
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    gap: 8,
                                                    padding: "8px 0",
                                                    borderBottom: "1px solid #d9d9d2",
                                                    fontSize: "0.9rem",
                                                }, children: [_jsxs("span", { children: [_jsx("strong", { children: h.symbol }), _jsxs("span", { style: { color: "#656663", marginLeft: 6 }, children: [h.amount, " units"] })] }), _jsx("span", { style: { fontWeight: 600 }, children: formatUsd(usd) })] }, h.id));
                                        }) }), _jsxs("div", { style: {
                                            marginTop: 12,
                                            paddingTop: 12,
                                            borderTop: "2px solid #cfcec8",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontWeight: 700,
                                            fontSize: "0.95rem",
                                        }, children: [_jsx("span", { children: "Total (check vs strip above)" }), _jsx("span", { children: formatUsd(totalUsd) })] })] }))] })] }), _jsxs("section", { className: "bottom-row card", children: [_jsx("h3", { children: "Recent Transactions" }), _jsx("p", { className: "live-note", style: { marginTop: 0 }, children: "Empty until your app records transfers. Sends from Portfolio update holdings, not this table yet." }), _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Type" }), _jsx("th", { children: "Date" }), _jsx("th", { children: "Asset" }), _jsx("th", { children: "Amount" }), _jsx("th", { children: "Status" })] }) }), _jsx("tbody", {})] })] }), tour.step === 0 ? (_jsx(WalkthroughPopup, { anchorRef: statRef, title: "Your total vs market prices", body: "Big number = all your pretend coins added up in dollars (same math as Portfolio). The three small cards are just today\u2019s BTC, ETH, USDT prices to read. They are not extra cash on top of your total.", onClose: tour.finish, onNext: tour.next, showNext: true, stepLabel: "1 / 3" })) : null, tour.step === 1 ? (_jsx(WalkthroughPopup, { anchorRef: chartRef, title: "Bar vs orange line", body: "Colored bar = how your own portfolio is split (BTC, ETH, XRP\u2026). Orange line = Bitcoin\u2019s public price this week only. It is like a stock chart for learning, not your balance.", onClose: tour.finish, onNext: tour.next, showNext: true, stepLabel: "2 / 3" })) : null, tour.step === 2 ? (_jsx(WalkthroughPopup, { anchorRef: holdingsRef, title: "This list is the proof", body: "Each row: units \u00D7 price = dollars on the right. Add those dollars and you get the big total above (and Portfolio\u2019s total too).", onClose: tour.finish, onNext: tour.finish, showNext: true, nextLabel: "Done", stepLabel: "3 / 3" })) : null] }));
}
