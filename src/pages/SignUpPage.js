import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// SignUpPage() - placeholder for registration UI (route: #/signup).
import { useState } from "react";
import { supabase } from "../services/supabaseClient";
export function SignUpPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const handleSignUp = async () => {
        setError("");
        // Check passwords match before sending to Supabase
        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            setError(error.message);
        }
        else {
            setSuccess(true);
        }
        setLoading(false);
    };
    if (success) {
        return (_jsxs("div", { style: { maxWidth: "400px", margin: "100px auto", padding: "20px" }, children: [_jsx("h2", { children: "Welcome to CryptoWallet!" }), _jsx("p", { children: "Your account has been created successfully." }), _jsx("p", { children: "You're one step away from managing your first crypto wallet." }), _jsx("a", { href: "#/login", children: "Login to get started" }), _jsx("p", { style: { marginTop: "10px" }, children: _jsx("a", { href: "#/home", children: "Back to home" }) })] }));
    }
    return (_jsxs("div", { style: { maxWidth: "400px", margin: "100px auto", padding: "20px" }, children: [_jsx("h2", { children: "Sign Up" }), error && _jsx("p", { style: { color: "red" }, children: error }), _jsx("input", { type: "email", placeholder: "Email", value: email, onChange: (e) => setEmail(e.target.value), style: { display: "block", marginBottom: "10px", width: "100%", padding: "8px" } }), _jsx("input", { type: "password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value), style: { display: "block", marginBottom: "10px", width: "100%", padding: "8px" } }), _jsx("input", { type: "password", placeholder: "Confirm Password", value: confirm, onChange: (e) => setConfirm(e.target.value), style: { display: "block", marginBottom: "10px", width: "100%", padding: "8px" } }), _jsx("button", { onClick: handleSignUp, disabled: loading, children: loading ? "Signing up..." : "Sign Up" }), _jsxs("p", { style: { marginTop: "10px" }, children: ["Already have an account? ", _jsx("a", { href: "#/login", children: "Login" })] }), _jsx("p", { style: { marginTop: "10px" }, children: _jsx("a", { href: "#/home", children: "Back to home" }) })] }));
}
