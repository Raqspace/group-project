import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// LoginPage() - placeholder for login and auth UI (route: #/login).
import { useState } from "react";
import { supabase } from "../services/supabaseClient";
export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const handleLogin = async () => {
        setLoading(true);
        setError("");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError(error.message);
        }
        else {
            window.location.hash = "#/dashboard";
        }
        setLoading(false);
    };
    return (_jsxs("div", { style: { maxWidth: "400px", margin: "100px auto", padding: "20px" }, children: [_jsx("h2", { children: "Login" }), error && _jsx("p", { style: { color: "red" }, children: error }), _jsx("input", { type: "email", placeholder: "Email", value: email, onChange: (e) => setEmail(e.target.value), style: { display: "block", marginBottom: "10px", width: "100%", padding: "8px" } }), _jsx("input", { type: "password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value), style: { display: "block", marginBottom: "10px", width: "100%", padding: "8px" } }), _jsx("button", { onClick: handleLogin, disabled: loading, children: loading ? "Logging in..." : "Login" }), _jsxs("p", { style: { marginTop: "10px" }, children: ["Don't have an account? ", _jsx("a", { href: "#/signup", children: "Sign up" })] }), _jsx("p", { style: { marginTop: "10px" }, children: _jsx("a", { href: "#/home", children: "Back to home" }) })] }));
}
