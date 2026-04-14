import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { supabase } from "../services/supabaseClient";
import { useListenTour } from "../utils/tourBus";
const COINS = ["BTC", "ETH", "XRP"];
export function TradePage() {
    const [tradeType, setTradeType] = useState("buy");
    const [selectedCoin, setSelectedCoin] = useState("BTC");
    const [amountGBP, setAmountGBP] = useState("");
    const [amountCoin, setAmountCoin] = useState("");
    const [prices, setPrices] = useState({ BTC: null, ETH: null, XRP: null });
    const [holdings, setHoldings] = useState([]);
    const [gbpBalance, setGbpBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [priceLoading, setPriceLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const workflowRef = useRef(null);
    const balancesRef = useRef(null);
    const pricesRef = useRef(null);
    const formRef = useRef(null);
    const tour = useWalkthroughTour();
    const startTour = useCallback(() => tour.start(), [tour.start]);
    useListenTour("trade", startTour);
    useEffect(() => {
        fetchPrices();
        fetchHoldings();
    }, []);
    const fetchPrices = async () => {
        setPriceLoading(true);
        try {
            const res = await fetch("https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,XRP&tsyms=GBP");
            const data = await res.json();
            setPrices({
                BTC: data.BTC.GBP,
                ETH: data.ETH.GBP,
                XRP: data.XRP.GBP,
            });
        }
        catch {
            setError("Could not fetch prices.");
        }
        finally {
            setPriceLoading(false);
        }
    };
    const fetchHoldings = async () => {
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user)
            return;
        const { data: wallet } = await supabase.from("Wallet").select("id, balance").eq("user_id", user.id).single();
        if (!wallet)
            return;
        setGbpBalance(Number(wallet.balance));
        const { data } = await supabase.from("holdings").select("symbol, amount").eq("wallet_id", wallet.id);
        if (data)
            setHoldings(data);
    };
    const getHolding = (symbol) => {
        const h = holdings.find((h) => h.symbol === symbol);
        return h ? Number(h.amount) : 0;
    };
    const currentPrice = prices[selectedCoin];
    const calculateCoinFromGBP = () => {
        if (!currentPrice || !amountGBP || isNaN(Number(amountGBP)))
            return null;
        return Number(amountGBP) / currentPrice;
    };
    const calculateGBPFromCoin = () => {
        if (!currentPrice || !amountCoin || isNaN(Number(amountCoin)))
            return null;
        return Number(amountCoin) * currentPrice;
    };
    const validate = () => {
        if (!currentPrice)
            return "Price not loaded yet";
        if (tradeType === "buy") {
            if (!amountGBP || isNaN(Number(amountGBP)))
                return "Enter a valid GBP amount";
            if (Number(amountGBP) <= 0)
                return "Amount must be greater than 0";
            if (Number(amountGBP) > gbpBalance) {
                return `Not enough GBP. You have £${gbpBalance.toFixed(2)}. Deposit first.`;
            }
        }
        else {
            if (!amountCoin || isNaN(Number(amountCoin)))
                return `Enter a valid ${selectedCoin} amount`;
            if (Number(amountCoin) <= 0)
                return "Amount must be greater than 0";
            if (Number(amountCoin) > getHolding(selectedCoin)) {
                return `Insufficient ${selectedCoin}. You have ${getHolding(selectedCoin).toFixed(6)} ${selectedCoin}`;
            }
        }
        return null;
    };
    const handleTrade = async () => {
        setError(null);
        setSuccess(null);
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }
        setLoading(true);
        try {
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user) {
                setError("You must be logged in");
                return;
            }
            const { data: wallet } = await supabase.from("Wallet").select("id, balance").eq("user_id", user.id).single();
            if (!wallet) {
                setError("Wallet not found");
                return;
            }
            const gbpAmount = tradeType === "buy" ? Number(amountGBP) : calculateGBPFromCoin();
            const coinAmount = tradeType === "buy" ? calculateCoinFromGBP() : Number(amountCoin);
            const newBalance = tradeType === "buy" ? wallet.balance - gbpAmount : wallet.balance + gbpAmount;
            await supabase.from("Wallet").update({ balance: newBalance }).eq("id", wallet.id);
            const { data: holding } = await supabase
                .from("holdings")
                .select("id, amount")
                .eq("wallet_id", wallet.id)
                .eq("symbol", selectedCoin)
                .single();
            if (holding) {
                const newAmount = tradeType === "buy" ? Number(holding.amount) + coinAmount : Number(holding.amount) - coinAmount;
                await supabase.from("holdings").update({ amount: newAmount }).eq("id", holding.id);
            }
            else if (tradeType === "buy") {
                await supabase.from("holdings").insert({ wallet_id: wallet.id, symbol: selectedCoin, amount: coinAmount });
            }
            await supabase.from("trades").insert({
                user_id: user.id,
                type: tradeType,
                asset: selectedCoin,
                amount_gbp: gbpAmount,
                amount_btc: coinAmount,
                price_at_trade: currentPrice,
            });
            setSuccess(tradeType === "buy"
                ? `Bought ${coinAmount.toFixed(6)} ${selectedCoin} for £${gbpAmount.toFixed(2)}`
                : `Sold ${coinAmount.toFixed(6)} ${selectedCoin} for £${gbpAmount.toFixed(2)}`);
            setAmountGBP("");
            setAmountCoin("");
            fetchHoldings();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Trade failed.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { style: { maxWidth: 560, margin: "0 auto", position: "relative" }, children: [_jsxs("div", { ref: workflowRef, className: "card", style: { marginBottom: "0.9rem" }, children: [_jsx("p", { style: { margin: 0, fontSize: "0.72rem", color: "#666764", textTransform: "uppercase", letterSpacing: "0.06em" }, children: "Your place in the flow" }), _jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginTop: "0.65rem" }, children: [_jsx("a", { href: "#/deposit", className: "chip secondary", children: "1 \u00B7 Deposit GBP" }), _jsx("span", { style: { color: "#8a8a85" }, children: "\u2192" }), _jsx("span", { className: "chip", style: { cursor: "default" }, children: "2 \u00B7 Trade" }), _jsx("span", { style: { color: "#8a8a85" }, children: "\u2192" }), _jsx("a", { href: "#/portfolio", className: "chip secondary", children: "3 \u00B7 Portfolio" })] }), _jsxs("p", { className: "live-note", style: { marginTop: "0.75rem", marginBottom: 0 }, children: [_jsx("strong", { children: "Buy" }), " spends your GBP and adds crypto to holdings. ", _jsx("strong", { children: "Sell" }), " does the reverse. Prices here are in", " ", _jsx("strong", { children: "\u00A3" }), " (GBP). Need cash?", " ", _jsx("a", { href: "#/deposit", style: { color: "#1f3c34", fontWeight: 600 }, children: "Deposit" }), "."] })] }), _jsxs("div", { ref: balancesRef, className: "card", style: { marginBottom: "0.9rem" }, children: [_jsx("div", { style: { fontSize: "0.72rem", color: "#666764", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }, children: "Balances for trading" }), _jsxs("p", { style: { margin: "0 0 12px", fontSize: "1rem", fontWeight: 700, color: "#2f5247" }, children: ["GBP (for buys): \u00A3", gbpBalance.toFixed(2)] }), gbpBalance < 1 ? (_jsxs("p", { className: "live-note", style: { margin: "0 0 12px" }, children: ["Add GBP on ", _jsx("a", { href: "#/deposit", children: "Deposit" }), " before you can buy."] })) : null, _jsx("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" }, children: COINS.map((coin) => (_jsxs("div", { style: {
                                display: "flex",
                                flexDirection: "column",
                                background: "#f8f8f4",
                                border: "1px solid #cdcdc7",
                                borderRadius: 10,
                                padding: "10px 14px",
                                minWidth: 100,
                            }, children: [_jsx("span", { style: { fontSize: 12, color: "#656663", fontWeight: 600 }, children: coin }), _jsx("span", { style: { fontSize: 15, fontWeight: 700, color: "#2e2e2d" }, children: getHolding(coin).toFixed(coin === "XRP" ? 2 : 6) }), _jsx("span", { style: { fontSize: 12, color: "#2f5247", marginTop: 2 }, children: prices[coin] != null ? `~£${(getHolding(coin) * prices[coin]).toFixed(2)}` : "—" })] }, coin))) })] }), _jsxs("div", { ref: pricesRef, className: "card", style: { marginBottom: "0.9rem" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("span", { style: { fontSize: "0.72rem", color: "#666764", textTransform: "uppercase", letterSpacing: "0.06em" }, children: "Live prices (GBP)" }), _jsx("button", { type: "button", className: "chip secondary", onClick: fetchPrices, disabled: priceLoading, style: { cursor: "pointer" }, children: priceLoading ? "…" : "Refresh" })] }), _jsx("div", { style: { display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }, children: COINS.map((coin) => (_jsxs("div", { style: {
                                display: "flex",
                                flexDirection: "column",
                                background: "#ecece8",
                                border: "1px solid #cdcdc7",
                                borderRadius: 10,
                                padding: "10px 14px",
                                minWidth: 100,
                            }, children: [_jsx("span", { style: { fontSize: 12, color: "#656663", fontWeight: 600 }, children: coin }), _jsx("span", { style: { fontSize: 15, fontWeight: 700, color: "#b45309" }, children: prices[coin] ? `£${prices[coin].toLocaleString()}` : "—" })] }, coin))) })] }), _jsxs("div", { ref: formRef, className: "card", children: [_jsxs("div", { style: { display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid #cdcdc7", marginBottom: 20 }, children: [_jsx("button", { type: "button", onClick: () => {
                                    setTradeType("buy");
                                    setAmountGBP("");
                                    setAmountCoin("");
                                    setError(null);
                                    setSuccess(null);
                                }, style: {
                                    flex: 1,
                                    padding: 10,
                                    border: "none",
                                    background: tradeType === "buy" ? "#2f5247" : "#f3f3ef",
                                    color: tradeType === "buy" ? "#fff" : "#454642",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }, children: "Buy" }), _jsx("button", { type: "button", onClick: () => {
                                    setTradeType("sell");
                                    setAmountGBP("");
                                    setAmountCoin("");
                                    setError(null);
                                    setSuccess(null);
                                }, style: {
                                    flex: 1,
                                    padding: 10,
                                    border: "none",
                                    background: tradeType === "sell" ? "#b91c1c" : "#f3f3ef",
                                    color: tradeType === "sell" ? "#fff" : "#454642",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }, children: "Sell" })] }), _jsxs("div", { style: { marginBottom: 16 }, children: [_jsx("label", { className: "live-note", style: { display: "block", fontWeight: 600, marginBottom: 6, color: "#454642" }, children: "Coin" }), _jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: COINS.map((coin) => (_jsx("button", { type: "button", onClick: () => {
                                        setSelectedCoin(coin);
                                        setAmountGBP("");
                                        setAmountCoin("");
                                        setError(null);
                                        setSuccess(null);
                                    }, className: selectedCoin === coin ? "chip" : "chip secondary", style: { cursor: "pointer" }, children: coin }, coin))) })] }), _jsx("div", { style: { marginBottom: 16 }, children: tradeType === "buy" ? (_jsxs(_Fragment, { children: [_jsx("label", { className: "live-note", style: { display: "block", fontWeight: 600, marginBottom: 6, color: "#454642" }, children: "Spend (\u00A3)" }), _jsx("input", { type: "number", placeholder: "e.g. 100", value: amountGBP, onChange: (e) => {
                                        setAmountGBP(e.target.value);
                                        setError(null);
                                        setSuccess(null);
                                    }, style: {
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: 10,
                                        border: "1px solid #cdcdc7",
                                        fontSize: "1rem",
                                        boxSizing: "border-box",
                                    }, min: 1 }), calculateCoinFromGBP() !== null ? (_jsxs("div", { style: {
                                        display: "flex",
                                        justifyContent: "space-between",
                                        background: "#d6ece4",
                                        border: "1px solid #87a69a",
                                        borderRadius: 10,
                                        padding: "10px 14px",
                                        marginTop: 8,
                                        fontSize: "0.9rem",
                                        color: "#2f5247",
                                    }, children: [_jsx("span", { children: "You get" }), _jsxs("strong", { children: [calculateCoinFromGBP().toFixed(6), " ", selectedCoin] })] })) : null] })) : (_jsxs(_Fragment, { children: [_jsxs("label", { className: "live-note", style: { display: "block", fontWeight: 600, marginBottom: 6, color: "#454642" }, children: ["Sell amount (", selectedCoin, ")"] }), _jsx("input", { type: "number", placeholder: "e.g. 0.001", value: amountCoin, onChange: (e) => {
                                        setAmountCoin(e.target.value);
                                        setError(null);
                                        setSuccess(null);
                                    }, style: {
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: 10,
                                        border: "1px solid #cdcdc7",
                                        fontSize: "1rem",
                                        boxSizing: "border-box",
                                    }, min: 0, step: "any" }), _jsxs("p", { className: "live-note", style: { marginTop: 6 }, children: ["Available: ", getHolding(selectedCoin).toFixed(6), " ", selectedCoin] }), calculateGBPFromCoin() !== null ? (_jsxs("div", { style: {
                                        display: "flex",
                                        justifyContent: "space-between",
                                        background: "#d6ece4",
                                        border: "1px solid #87a69a",
                                        borderRadius: 10,
                                        padding: "10px 14px",
                                        marginTop: 8,
                                        fontSize: "0.9rem",
                                        color: "#2f5247",
                                    }, children: [_jsx("span", { children: "You get" }), _jsxs("strong", { children: ["\u00A3", calculateGBPFromCoin().toFixed(2)] })] })) : null] })) }), error ? _jsx("p", { className: "live-error", children: error }) : null, success ? (_jsxs("p", { style: { color: "#2f5247", fontWeight: 600, marginBottom: 12 }, children: [success, " ", _jsx("a", { href: "#/portfolio", style: { color: "#1f3c34" }, children: "View Portfolio \u2192" })] })) : null, _jsx("button", { type: "button", onClick: handleTrade, disabled: loading || priceLoading, style: {
                            width: "100%",
                            padding: 12,
                            border: "none",
                            borderRadius: 10,
                            color: "#fff",
                            fontSize: "1rem",
                            fontWeight: 600,
                            cursor: loading || priceLoading ? "not-allowed" : "pointer",
                            opacity: loading || priceLoading ? 0.65 : 1,
                            background: tradeType === "buy" ? "#2f5247" : "#b91c1c",
                        }, children: loading
                            ? "Working…"
                            : tradeType === "buy"
                                ? `Buy ${selectedCoin} with £${amountGBP || "0"}`
                                : `Sell ${amountCoin || "0"} ${selectedCoin}` })] }), tour.step === 0 ? (_jsx(WalkthroughPopup, { anchorRef: workflowRef, title: "Trade in the flow", body: "You are on step 2. Deposit adds GBP. Here you swap GBP \u2194 crypto. Portfolio shows results in USD.", onClose: tour.finish, onNext: tour.next, showNext: true, stepLabel: "1 / 3" })) : null, tour.step === 1 ? (_jsx(WalkthroughPopup, { anchorRef: balancesRef, title: "What you can spend", body: "GBP pays for buys. Coin amounts are what you already own. Sell returns GBP to the same balance.", onClose: tour.finish, onNext: tour.next, showNext: true, stepLabel: "2 / 3" })) : null, tour.step === 2 ? (_jsx(WalkthroughPopup, { anchorRef: formRef, title: "Buy or sell", body: "Pick coin, type \u00A3 to spend or coins to sell, confirm. Quotes use GBP from the price row above.", onClose: tour.finish, onNext: tour.finish, showNext: true, nextLabel: "Done", stepLabel: "3 / 3" })) : null] }));
}
