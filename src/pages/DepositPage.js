import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { supabase } from "../services/supabaseClient";
import { useListenTour } from "../utils/tourBus";
const stripePromise = loadStripe("pk_test_51TLu8m25bgZQ9l5jklfaIuxmQdtEBVNANJYpR1lldUtDpd5ujAQhVqhjnj3To4ZuBdcirc7HVYblqro7Wm1CVTen00aecwxCs0");
function DepositForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [gbpBalance, setGbpBalance] = useState(null);
    const workflowRef = useRef(null);
    const amountRef = useRef(null);
    const payRef = useRef(null);
    const tour = useWalkthroughTour();
    const startTour = useCallback(() => tour.start(), [tour.start]);
    useListenTour("deposit", startTour);
    const loadBalance = async () => {
        const { data: { user }, } = await supabase.auth.getUser();
        if (!user)
            return;
        const { data: wallet } = await supabase.from("Wallet").select("balance").eq("user_id", user.id).single();
        if (wallet && typeof wallet.balance === "number")
            setGbpBalance(wallet.balance);
    };
    useEffect(() => {
        loadBalance();
    }, []);
    const handleDeposit = async () => {
        setError(null);
        setSuccess(null);
        if (!amount || isNaN(Number(amount)) || Number(amount) < 1) {
            setError("Enter a valid amount (minimum £1)");
            return;
        }
        if (!stripe || !elements) {
            setError("Stripe not loaded yet");
            return;
        }
        setLoading(true);
        try {
            const { data: { session }, } = await supabase.auth.getSession();
            const res = await fetch("https://yjhpbjfuxvcpcxnpotgi.supabase.co/functions/v1/create-payment-intent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ amount: Number(amount) }),
            });
            const { clientSecret, error: fnError } = await res.json();
            if (fnError)
                throw new Error(fnError);
            const cardElement = elements.getElement(CardElement);
            if (!cardElement)
                throw new Error("Card element not found");
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: { card: cardElement },
            });
            if (stripeError)
                throw new Error(stripeError.message);
            if (paymentIntent?.status === "succeeded") {
                const { data: { user }, } = await supabase.auth.getUser();
                if (!user)
                    throw new Error("Not logged in");
                const { data: wallet } = await supabase.from("Wallet").select("id, balance").eq("user_id", user.id).single();
                if (!wallet)
                    throw new Error("Wallet not found");
                const { error: updateError } = await supabase
                    .from("Wallet")
                    .update({ balance: wallet.balance + Number(amount) })
                    .eq("id", wallet.id);
                if (updateError)
                    throw updateError;
                setSuccess(`£${amount} added. Your GBP balance is ready for Trade.`);
                setAmount("");
                cardElement.clear();
                loadBalance();
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Deposit failed.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { style: { maxWidth: 520, margin: "0 auto", position: "relative" }, children: [_jsxs("div", { ref: workflowRef, className: "card", style: { marginBottom: "0.9rem" }, children: [_jsx("p", { style: { margin: 0, fontSize: "0.72rem", color: "#666764", textTransform: "uppercase", letterSpacing: "0.06em" }, children: "Your place in the flow" }), _jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginTop: "0.65rem" }, children: [_jsx("span", { className: "chip", style: { cursor: "default" }, children: "1 \u00B7 Deposit GBP" }), _jsx("span", { style: { color: "#8a8a85" }, children: "\u2192" }), _jsx("a", { href: "#/trade", className: "chip secondary", children: "2 \u00B7 Trade" }), _jsx("span", { style: { color: "#8a8a85" }, children: "\u2192" }), _jsx("a", { href: "#/portfolio", className: "chip secondary", children: "3 \u00B7 Portfolio" })] }), _jsxs("p", { className: "live-note", style: { marginTop: "0.75rem", marginBottom: 0 }, children: [_jsx("strong", { children: "Deposit" }), " only tops up ", _jsx("strong", { children: "pounds (GBP)" }), " on your account. It does not buy crypto by itself. Use", " ", _jsx("strong", { children: "Trade" }), " next to swap GBP for BTC, ETH, or XRP."] }), _jsxs("p", { style: { margin: "0.6rem 0 0", fontSize: "0.9rem", fontWeight: 600, color: "#2f5247" }, children: ["GBP balance now: ", gbpBalance === null ? "…" : `£${gbpBalance.toFixed(2)}`] })] }), _jsxs("div", { ref: amountRef, className: "card", style: { marginBottom: "0.9rem" }, children: [_jsx("label", { className: "live-note", style: { display: "block", marginBottom: 6, fontWeight: 600, color: "#454642" }, children: "Amount (\u00A3)" }), _jsx("input", { type: "number", placeholder: "e.g. 100", value: amount, min: 1, onChange: (e) => {
                            setAmount(e.target.value);
                            setError(null);
                        }, style: {
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid #cdcdc7",
                            fontSize: "1rem",
                            boxSizing: "border-box",
                            background: "#fff",
                        } }), _jsx("div", { style: { display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }, children: [50, 100, 250, 500].map((preset) => (_jsxs("button", { type: "button", onClick: () => setAmount(String(preset)), className: amount === String(preset) ? "chip" : "chip secondary", style: { cursor: "pointer" }, children: ["\u00A3", preset] }, preset))) })] }), _jsxs("div", { ref: payRef, className: "card", children: [_jsx("label", { className: "live-note", style: { display: "block", marginBottom: 6, fontWeight: 600, color: "#454642" }, children: "Card (test mode)" }), _jsx("div", { style: {
                            padding: 12,
                            border: "1px solid #cdcdc7",
                            borderRadius: 12,
                            background: "#fff",
                        }, children: _jsx(CardElement, { options: {
                                hidePostalCode: true,
                                style: {
                                    base: {
                                        fontSize: "16px",
                                        color: "#2e2e2d",
                                        "::placeholder": { color: "#9ca3af" },
                                    },
                                },
                            } }) }), _jsx("p", { className: "live-note", style: { marginTop: 8 }, children: "Test: 4242 4242 4242 4242 \u00B7 any future date \u00B7 any CVC" }), error ? (_jsx("p", { className: "live-error", style: { marginTop: 12 }, children: error })) : null, success ? (_jsxs("p", { style: { marginTop: 12, color: "#2f5247", fontWeight: 600, fontSize: "0.9rem" }, children: [success, " ", _jsx("a", { href: "#/trade", style: { color: "#1f3c34" }, children: "Open Trade \u2192" })] })) : null, _jsx("button", { type: "button", onClick: handleDeposit, disabled: loading || !stripe, className: "chip", style: {
                            marginTop: 16,
                            width: "100%",
                            padding: "12px",
                            cursor: loading || !stripe ? "not-allowed" : "pointer",
                            opacity: loading || !stripe ? 0.65 : 1,
                            border: "1px solid #87a69a",
                            background: "#2f5247",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: "1rem",
                            borderRadius: 10,
                        }, children: loading ? "Processing…" : `Pay £${amount || "0"}` })] }), tour.step === 0 ? (_jsx(WalkthroughPopup, { anchorRef: workflowRef, title: "Deposit = add pounds", body: "This page increases your GBP balance. Trade uses that cash to buy coins. Portfolio shows coins in USD.", onClose: tour.finish, onNext: tour.next, showNext: true, stepLabel: "1 / 3" })) : null, tour.step === 1 ? (_jsx(WalkthroughPopup, { anchorRef: amountRef, title: "How much?", body: "Choose \u00A3 to add. Quick buttons fill the box. Minimum \u00A31.", onClose: tour.finish, onNext: tour.next, showNext: true, stepLabel: "2 / 3" })) : null, tour.step === 2 ? (_jsx(WalkthroughPopup, { anchorRef: payRef, title: "Pay & next step", body: "Card runs in test mode here. When it succeeds, go to Trade to buy BTC, ETH, or XRP with your new GBP.", onClose: tour.finish, onNext: tour.finish, showNext: true, nextLabel: "Done", stepLabel: "3 / 3" })) : null] }));
}
export function DepositPage() {
    return (_jsx(Elements, { stripe: stripePromise, children: _jsx(DepositForm, {}) }));
}
