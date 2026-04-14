import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { supabase } from "../services/supabaseClient";
import { useListenTour } from "../utils/tourBus";
import { portfolioTotalUsd } from "../utils/unitPrices";
const formatUsd = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
function unitPx(symbol, u) {
    const m = { BTC: u.BTC, ETH: u.ETH, XRP: u.XRP, USDT: u.USDT };
    return m[symbol] ?? 0;
}
export function PortfolioPage({ unitPrices }) {
    const [wallet, setWallet] = useState(null);
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("send");
    const [recipientAddress, setRecipientAddress] = useState("");
    const [sendAmount, setSendAmount] = useState("");
    const [sendSymbol, setSendSymbol] = useState("ETH");
    const [sendError, setSendError] = useState("");
    const [sendSuccess, setSendSuccess] = useState("");
    const [sendLoading, setSendLoading] = useState(false);
    const workflowRef = useRef(null);
    const totalRef = useRef(null);
    const actionsRef = useRef(null);
    const holdingsRef = useRef(null);
    const tour = useWalkthroughTour();
    const startTour = useCallback(() => tour.start(), [tour.start]);
    useListenTour("portfolio", startTour);
    const totalUsd = portfolioTotalUsd(holdings, unitPrices);
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        setLoading(true);
        await loadWallet();
        setLoading(false);
    };
    const loadWallet = async () => {
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user)
            return;
        const { data: walletData } = await supabase.from("Wallet").select("*").eq("user_id", user.id).single();
        if (walletData) {
            setWallet(walletData);
            loadHoldings(walletData.id);
        }
    };
    const loadHoldings = async (walletId) => {
        const { data } = await supabase.from("holdings").select("*").eq("wallet_id", walletId);
        if (data)
            setHoldings(data);
    };
    const openModal = (type) => {
        setModalType(type);
        setSendError("");
        setSendSuccess("");
        setRecipientAddress("");
        setSendAmount("");
        setShowModal(true);
    };
    const handleSend = async () => {
        setSendError("");
        setSendSuccess("");
        const amount = parseFloat(sendAmount);
        if (!recipientAddress) {
            setSendError("Please enter a recipient address");
            return;
        }
        if (!amount || amount <= 0) {
            setSendError("Please enter a valid amount");
            return;
        }
        const holding = holdings.find((h) => h.symbol === sendSymbol);
        if (!holding || holding.amount < amount) {
            setSendError("Insufficient balance");
            return;
        }
        if (recipientAddress === wallet.public_address) {
            setSendError("Cannot send to your own address");
            return;
        }
        setSendLoading(true);
        const { error: deductError } = await supabase
            .from("holdings")
            .update({ amount: holding.amount - amount })
            .eq("id", holding.id);
        if (deductError) {
            setSendError("Transaction failed");
            setSendLoading(false);
            return;
        }
        const { data: recipientWallet } = await supabase
            .from("Wallet")
            .select("id")
            .eq("public_address", recipientAddress)
            .single();
        if (recipientWallet) {
            const { data: recipientHolding } = await supabase
                .from("holdings")
                .select("*")
                .eq("wallet_id", recipientWallet.id)
                .eq("symbol", sendSymbol)
                .single();
            if (recipientHolding) {
                await supabase
                    .from("holdings")
                    .update({ amount: recipientHolding.amount + amount })
                    .eq("id", recipientHolding.id);
            }
        }
        setSendSuccess(`Successfully sent ${amount} ${sendSymbol}`);
        setRecipientAddress("");
        setSendAmount("");
        loadWallet();
        setSendLoading(false);
    };
    if (loading) {
        return _jsx("p", { style: { padding: "40px" }, children: "Loading portfolio..." });
    }
    return (_jsxs("div", { style: { maxWidth: 700, margin: "0 auto", padding: "0 0 24px", position: "relative" }, children: [_jsxs("div", { ref: workflowRef, className: "card", style: { marginBottom: "0.9rem" }, children: [_jsx("p", { style: { margin: 0, fontSize: "0.72rem", color: "#666764", textTransform: "uppercase", letterSpacing: "0.06em" }, children: "Your place in the flow" }), _jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginTop: "0.65rem" }, children: [_jsx("a", { href: "#/deposit", className: "chip secondary", children: "1 \u00B7 Deposit GBP" }), _jsx("span", { style: { color: "#8a8a85" }, children: "\u2192" }), _jsx("a", { href: "#/trade", className: "chip secondary", children: "2 \u00B7 Trade" }), _jsx("span", { style: { color: "#8a8a85" }, children: "\u2192" }), _jsx("span", { className: "chip", style: { cursor: "default" }, children: "3 \u00B7 Portfolio" })] }), _jsxs("p", { className: "live-note", style: { marginTop: "0.75rem", marginBottom: 0 }, children: ["This screen sums your ", _jsx("strong", { children: "crypto holdings in USD" }), " (not your GBP cash balance). Got no rows yet?", " ", _jsx("a", { href: "#/deposit", style: { color: "#1f3c34", fontWeight: 600 }, children: "Deposit" }), ", then", " ", _jsx("a", { href: "#/trade", style: { color: "#1f3c34", fontWeight: 600 }, children: "Trade" }), "."] })] }), _jsxs("div", { ref: totalRef, style: { background: "#1B3A5C", color: "white", padding: "24px", borderRadius: "8px", marginBottom: "30px" }, children: [_jsx("p", { style: { margin: 0, opacity: 0.7 }, children: "Total portfolio value (USD)" }), _jsx("h2", { style: { margin: "8px 0 0" }, children: formatUsd(totalUsd) }), _jsxs("p", { style: { margin: "10px 0 0", fontSize: "13px", opacity: 0.85, lineHeight: 1.45 }, children: ["This is the sum of every row below: ", _jsx("strong", { children: "amount \u00D7 today\u2019s USD price" }), " for each coin. Dashboard uses the same prices, so this number should match the ", _jsx("strong", { children: "Portfolio total" }), " and the ", _jsx("strong", { children: "Holdings total" }), " there."] }), _jsxs("p", { style: { margin: "8px 0 0", fontSize: "13px", opacity: 0.6 }, children: ["Practice wallet: ", wallet?.public_address?.slice(0, 18), "\u2026"] })] }), _jsxs("div", { ref: actionsRef, style: { display: "flex", gap: "12px", marginBottom: "30px" }, children: [_jsx("button", { type: "button", onClick: () => openModal("send"), style: {
                            padding: "10px 24px",
                            background: "#1B3A5C",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "15px",
                        }, children: "Send" }), _jsx("button", { type: "button", onClick: () => openModal("receive"), style: {
                            padding: "10px 24px",
                            background: "#2E7D32",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "15px",
                        }, children: "Receive" })] }), _jsx("h3", { ref: holdingsRef, children: "My holdings" }), _jsxs("p", { style: { margin: "0 0 14px", fontSize: "0.88rem", color: "#555" }, children: [_jsx("strong", { children: "Units" }), " = how many coins the simulator stored for you. ", _jsx("strong", { children: "USD value" }), " = units \u00D7 the price shown. Prices refresh with the rest of the app (BTC, ETH, USDT from the main feed, XRP from the same snapshot)."] }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: "12px" }, children: holdings.map((h) => {
                    const up = unitPx(h.symbol, unitPrices);
                    const lineUsd = h.amount * up;
                    return (_jsxs("div", { style: {
                            background: "#f5f5f5",
                            padding: "16px",
                            borderRadius: "8px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }, children: [_jsxs("div", { children: [_jsx("strong", { style: { fontSize: "18px" }, children: h.symbol }), _jsxs("p", { style: { margin: "4px 0 0", color: "#666", fontSize: "14px" }, children: [h.amount, " units"] })] }), _jsxs("div", { style: { textAlign: "right" }, children: [_jsx("strong", { children: formatUsd(lineUsd) }), _jsxs("p", { style: { margin: "4px 0 0", color: "#666", fontSize: "13px" }, children: ["@ ", formatUsd(up), " / unit"] })] })] }, h.id));
                }) }), holdings.length > 0 ? (_jsxs("div", { style: {
                    marginTop: 16,
                    padding: "12px 14px",
                    background: "#ecece8",
                    borderRadius: 8,
                    border: "1px solid #cdcdc7",
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                }, children: [_jsx("span", { children: "Cross-check total" }), _jsx("span", { children: formatUsd(totalUsd) })] })) : null, showModal && (_jsx("div", { style: {
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                }, children: _jsxs("div", { style: { background: "white", padding: "30px", borderRadius: "12px", width: "400px", position: "relative" }, children: [_jsx("button", { type: "button", onClick: () => setShowModal(false), style: {
                                position: "absolute",
                                top: "12px",
                                right: "16px",
                                background: "none",
                                border: "none",
                                fontSize: "20px",
                                cursor: "pointer",
                            }, children: "\u2715" }), modalType === "send" ? (_jsxs(_Fragment, { children: [_jsx("h3", { children: "Send Crypto" }), sendError && _jsx("p", { style: { color: "red" }, children: sendError }), sendSuccess && _jsx("p", { style: { color: "green" }, children: sendSuccess }), _jsxs("select", { value: sendSymbol, onChange: (e) => setSendSymbol(e.target.value), style: { display: "block", width: "100%", padding: "8px", marginBottom: "10px" }, children: [_jsx("option", { value: "BTC", children: "BTC" }), _jsx("option", { value: "ETH", children: "ETH" }), _jsx("option", { value: "XRP", children: "XRP" })] }), _jsx("input", { type: "text", placeholder: "Recipient address (0x...)", value: recipientAddress, onChange: (e) => setRecipientAddress(e.target.value), style: { display: "block", width: "100%", padding: "8px", marginBottom: "10px" } }), _jsx("input", { type: "number", placeholder: "Amount", value: sendAmount, onChange: (e) => setSendAmount(e.target.value), style: { display: "block", width: "100%", padding: "8px", marginBottom: "16px" } }), _jsx("button", { type: "button", onClick: handleSend, disabled: sendLoading, style: {
                                        width: "100%",
                                        padding: "10px",
                                        background: "#1B3A5C",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                    }, children: sendLoading ? "Sending..." : "Confirm Send" })] })) : (_jsxs(_Fragment, { children: [_jsx("h3", { children: "Receive Crypto" }), _jsx("p", { children: "Share your wallet address to receive crypto:" }), _jsx("div", { style: { background: "#eee", padding: "12px", borderRadius: "6px", wordBreak: "break-all", fontSize: "13px" }, children: wallet?.public_address }), _jsx("button", { type: "button", onClick: () => navigator.clipboard.writeText(wallet?.public_address), style: {
                                        marginTop: "12px",
                                        width: "100%",
                                        padding: "10px",
                                        background: "#2E7D32",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                    }, children: "Copy Address" })] }))] }) })), wallet && tour.step === 0 ? (_jsx(WalkthroughPopup, { anchorRef: workflowRef, title: "End of the flow", body: "Deposit adds GBP. Trade turns GBP into crypto (or back). Portfolio is where you review what you own, valued in USD.", onClose: tour.finish, onNext: tour.next, showNext: true, stepLabel: "1 / 4" })) : null, wallet && tour.step === 1 ? (_jsx(WalkthroughPopup, { anchorRef: totalRef, title: "Total in dollars", body: "Pretend portfolio only. This number is the sum of every coin row below (amount \u00D7 price). Matches Dashboard.", onClose: tour.finish, onNext: tour.next, showNext: true, stepLabel: "2 / 4" })) : null, wallet && tour.step === 2 ? (_jsx(WalkthroughPopup, { anchorRef: actionsRef, title: "Send / Receive", body: "Send moves one asset to another user\u2019s address in this app. Receive shows your address to copy. Simulator only, not a real chain.", onClose: tour.finish, onNext: tour.next, showNext: true, stepLabel: "3 / 4" })) : null, wallet && tour.step === 3 ? (_jsx(WalkthroughPopup, { anchorRef: holdingsRef, title: "Each row", body: "Left = how many coins you have. Right = that stack in USD. Add the right side \u2192 equals the blue total.", onClose: tour.finish, onNext: tour.finish, showNext: true, nextLabel: "Done", stepLabel: "4 / 4" })) : null] }));
}
