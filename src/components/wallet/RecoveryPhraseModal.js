import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export function RecoveryPhraseModal({ phrase, onContinue }) {
    const [confirmed, setConfirmed] = useState(false);
    const words = phrase.split(" ");
    return (_jsx("div", { style: {
            position: "fixed",
            inset: 0,
            background: "rgba(46, 46, 45, 0.45)",
            zIndex: 3000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
        }, role: "dialog", "aria-modal": "true", "aria-labelledby": "recovery-title", children: _jsxs("div", { style: {
                background: "#f6f6f3",
                border: "1px solid #cdcdc7",
                borderRadius: 16,
                maxWidth: 520,
                width: "100%",
                padding: "24px 22px",
                boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
            }, children: [_jsx("h2", { id: "recovery-title", style: { margin: "0 0 10px", fontSize: "1.25rem", color: "#2e2e2d" }, children: "Your recovery phrase" }), _jsxs("p", { style: { margin: "0 0 14px", fontSize: "0.9rem", lineHeight: 1.55, color: "#4b5563" }, children: ["A ", _jsx("strong", { children: "recovery phrase" }), " is a secret list of words that can restore access to this simulated wallet if you lose your login or device. In real wallets, anyone with this phrase can move your funds, so you must never share it or store it only online."] }), _jsx("p", { style: { margin: "0 0 14px", fontSize: "0.9rem", lineHeight: 1.55, color: "#b91c1c", fontWeight: 600 }, children: "For this CryptoWallet simulator: write it down and keep it private. Treat it like a real phrase so the habit sticks." }), _jsx("div", { style: {
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 8,
                        marginBottom: 16,
                        padding: 14,
                        background: "#fff",
                        border: "1px solid #d0d0ca",
                        borderRadius: 12,
                        fontFamily: "ui-monospace, monospace",
                        fontSize: "0.85rem",
                    }, children: words.map((w, i) => (_jsxs("span", { style: { color: "#1f2937" }, children: [i + 1, ". ", w] }, i))) }), _jsx("button", { type: "button", onClick: () => navigator.clipboard.writeText(phrase), style: {
                        marginBottom: 14,
                        padding: "8px 14px",
                        borderRadius: 10,
                        border: "1px solid #87a69a",
                        background: "#d6ece4",
                        color: "#2f5247",
                        fontWeight: 600,
                        cursor: "pointer",
                    }, children: "Copy phrase" }), _jsxs("label", { style: {
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        marginBottom: 18,
                        fontSize: "0.88rem",
                        color: "#374151",
                        cursor: "pointer",
                    }, children: [_jsx("input", { type: "checkbox", checked: confirmed, onChange: (e) => setConfirmed(e.target.checked), style: { marginTop: 3 } }), _jsx("span", { children: "I have saved these words somewhere safe offline (paper or password manager), not in a chat or screenshot only." })] }), _jsx("button", { type: "button", disabled: !confirmed, onClick: onContinue, style: {
                        width: "100%",
                        padding: "12px",
                        borderRadius: 10,
                        border: "1px solid #87a69a",
                        background: confirmed ? "#2f5247" : "#d1d5db",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: confirmed ? "pointer" : "not-allowed",
                    }, children: "Continue to portfolio" })] }) }));
}
