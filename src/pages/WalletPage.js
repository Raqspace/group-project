import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// WalletPage() — wallet creation, recovery phrase, walkthrough.
import { useCallback, useEffect, useRef, useState } from "react";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { RecoveryPhraseModal } from "../components/wallet/RecoveryPhraseModal";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { supabase } from "../services/supabaseClient";
import { useListenTour } from "../utils/tourBus";
import { generateSimRecoveryPhrase } from "../utils/simRecoveryPhrase";
export function WalletPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [wallet, setWallet] = useState(null);
    const [holdings, setHoldings] = useState([]);
    const [revealPhrase, setRevealPhrase] = useState(null);
    const introRef = useRef(null);
    const createBtnRef = useRef(null);
    const balancesRef = useRef(null);
    const receiveSectionRef = useRef(null);
    const tourContextRef = useRef({ hasWallet: false, phraseOpen: false });
    const tourCreate = useWalkthroughTour();
    const tourSaved = useWalkthroughTour();
    tourContextRef.current = { hasWallet: !!wallet, phraseOpen: !!revealPhrase };
    const startWalletTour = useCallback(() => {
        const { hasWallet: hw, phraseOpen } = tourContextRef.current;
        if (phraseOpen)
            return;
        if (!hw)
            tourCreate.start();
        else
            tourSaved.start();
    }, [tourCreate.start, tourSaved.start]);
    useListenTour("wallet", startWalletTour);
    useEffect(() => {
        loadWallet();
    }, []);
    useEffect(() => {
        if (wallet)
            tourCreate.finish();
        else
            tourSaved.finish();
    }, [wallet, tourCreate.finish, tourSaved.finish]);
    const generateWalletAddress = () => {
        const chars = "0123456789abcdef";
        let address = "0x";
        for (let i = 0; i < 40; i++) {
            address += chars[Math.floor(Math.random() * chars.length)];
        }
        return address;
    };
    const loadWallet = async () => {
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user)
            return;
        const { data: walletData } = await supabase
            .from("Wallet")
            .select("*")
            .eq("user_id", user.id)
            .single();
        if (walletData) {
            setWallet(walletData);
            const { data: rows } = await supabase
                .from("holdings")
                .select("id, symbol, amount")
                .eq("wallet_id", walletData.id);
            if (rows)
                setHoldings(rows);
        }
        else {
            setHoldings([]);
        }
    };
    const handleCreateWallet = async () => {
        setLoading(true);
        setError("");
        setSuccess("");
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user) {
            setError("You must be logged in to create a wallet");
            setLoading(false);
            return;
        }
        const { data: existing } = await supabase
            .from("Wallet")
            .select("id")
            .eq("user_id", user.id)
            .single();
        if (existing) {
            setError("You already have a wallet");
            setLoading(false);
            return;
        }
        const phrase = generateSimRecoveryPhrase();
        const baseRow = {
            user_id: user.id,
            public_address: generateWalletAddress(),
            balance: 0,
        };
        let { error: walletError } = await supabase
            .from("Wallet")
            .insert({ ...baseRow, recovery_phrase: phrase });
        if (walletError) {
            const retry = await supabase.from("Wallet").insert(baseRow);
            walletError = retry.error;
        }
        if (walletError) {
            setError("Failed to create wallet. Please try again.");
            setLoading(false);
            return;
        }
        const { data: newWallet } = await supabase
            .from("Wallet")
            .select("id")
            .eq("user_id", user.id)
            .single();
        if (!newWallet) {
            setError("Wallet created but could not load id.");
            setLoading(false);
            return;
        }
        await supabase.from("holdings").insert([
            { wallet_id: newWallet.id, symbol: "BTC", amount: 0.001 },
            { wallet_id: newWallet.id, symbol: "ETH", amount: 1.5 },
            { wallet_id: newWallet.id, symbol: "XRP", amount: 100 },
        ]);
        setLoading(false);
        setSuccess("Wallet created.");
        setRevealPhrase(phrase);
        await loadWallet();
    };
    const afterRecoveryContinue = () => {
        setRevealPhrase(null);
        window.location.hash = "#/portfolio";
    };
    if (revealPhrase) {
        return _jsx(RecoveryPhraseModal, { phrase: revealPhrase, onContinue: afterRecoveryContinue });
    }
    if (!wallet) {
        return (_jsxs("div", { style: { maxWidth: "600px", margin: "60px auto", padding: "20px", position: "relative" }, children: [_jsxs("div", { ref: introRef, children: [_jsx("h2", { children: "Welcome to Your Crypto Wallet" }), _jsx("p", { children: "You do not have a wallet yet. Create one to get started." })] }), error && _jsx("p", { style: { color: "red" }, children: error }), success && _jsx("p", { style: { color: "green", marginTop: "10px" }, children: success }), _jsx("button", { ref: createBtnRef, type: "button", onClick: handleCreateWallet, disabled: loading, style: { marginTop: "20px", padding: "12px 24px", fontSize: "16px" }, children: loading ? "Creating your wallet..." : "Create My Wallet" }), tourCreate.step === 0 ? (_jsx(WalkthroughPopup, { anchorRef: introRef, title: "No wallet yet", body: "This makes a practice wallet in the app (not a real bank). You get demo coins, an address, and a recovery phrase to save.", onClose: tourCreate.finish, onNext: tourCreate.next, showNext: true, stepLabel: "1 / 2" })) : null, tourCreate.step === 1 ? (_jsx(WalkthroughPopup, { anchorRef: createBtnRef, title: "Create button", body: "Creates your address, seeds BTC/ETH/XRP amounts, then shows 12 words once. Next stop: Portfolio.", onClose: tourCreate.finish, onNext: tourCreate.finish, showNext: true, nextLabel: "OK", stepLabel: "2 / 2" })) : null] }));
    }
    return (_jsxs("div", { style: { maxWidth: "700px", margin: "40px auto", padding: "20px", position: "relative" }, children: [_jsxs("div", { style: { background: "#f5f5f5", padding: "20px", borderRadius: "8px", marginBottom: "30px" }, children: [_jsx("h2", { children: "My Wallet" }), _jsxs("p", { style: { fontSize: "0.9rem", color: "#555", marginBottom: 12 }, children: ["In this simulator one practice address stands in for receiving funds. Your real balances for each coin live in the", " ", _jsx("strong", { children: "holdings" }), " list below and match what you see on Portfolio."] }), _jsxs("p", { children: [_jsx("strong", { children: "Address:" }), " ", wallet.public_address] }), _jsxs("p", { style: { marginTop: "12px", fontSize: "1.2rem" }, children: [_jsx("strong", { children: "GBP Balance:" }), " \u00A3", wallet.balance.toFixed(2)] }), _jsx("a", { href: "#/deposit", style: { display: "inline-block", marginTop: "8px", fontWeight: 600 }, children: "+ Deposit Funds" }), _jsxs("div", { ref: balancesRef, style: { marginTop: 14 }, children: [_jsx("strong", { children: "Holdings (amounts)" }), holdings.length === 0 ? (_jsx("p", { style: { margin: "8px 0 0", color: "#666" }, children: "No rows yet. They appear when the wallet is created." })) : (_jsx("ul", { style: { margin: "8px 0 0", paddingLeft: 20 }, children: holdings.map((h) => (_jsxs("li", { children: [h.amount, " ", h.symbol] }, h.id))) }))] })] }), _jsxs("div", { style: { marginBottom: "30px", padding: "14px 16px", background: "#ecece8", borderRadius: 8, border: "1px solid #cdcdc7" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Send crypto" }), _jsxs("p", { style: { margin: "0 0 10px", fontSize: "0.9rem", color: "#454642" }, children: ["Sends are handled on the ", _jsx("strong", { children: "Portfolio" }), " page so you pick the asset (BTC, ETH, XRP) and the app updates the right holding. The old ETH-only field here did not match your real balances."] }), _jsx("a", { href: "#/portfolio", style: { fontWeight: 600, color: "#1f3c34" }, children: "Open Portfolio to send" })] }), _jsxs("div", { ref: receiveSectionRef, style: { marginBottom: "30px" }, children: [_jsx("h3", { children: "Receive Crypto" }), _jsx("p", { children: "Share your address to receive crypto:" }), _jsx("div", { style: { background: "#eee", padding: "10px", borderRadius: "4px", wordBreak: "break-all" }, children: wallet.public_address }), _jsx("button", { type: "button", onClick: () => navigator.clipboard.writeText(wallet.public_address), style: { marginTop: "10px" }, children: "Copy Address" })] }), tourSaved.step === 0 ? (_jsx(WalkthroughPopup, { anchorRef: balancesRef, title: "Address + amounts", body: "0x line = practice receive address. List = your coin counts (same as Portfolio / Dashboard math). To send, use Portfolio.", onClose: tourSaved.finish, onNext: tourSaved.next, showNext: true, stepLabel: "1 / 2" })) : null, tourSaved.step === 1 ? (_jsx(WalkthroughPopup, { anchorRef: receiveSectionRef, title: "Receive", body: "Share this address so someone can send you practice coins here. Address is ok to share; recovery phrase is not.", onClose: tourSaved.finish, onNext: tourSaved.finish, showNext: true, nextLabel: "Done", stepLabel: "2 / 2" })) : null] }));
}
