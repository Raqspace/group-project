import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useLivePrices } from "../hooks/useLivePrices";
import { AlertsPage } from "../pages/AlertsPage";
import { ContactsPage } from "../pages/ContactsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { SettingsPage } from "../pages/SettingsPage";
import { SignUpPage } from "../pages/SignUpPage";
import { TradePage } from "../pages/TradePage";
import { TransactionsPage } from "../pages/TransactionsPage";
import { WalletPage } from "../pages/WalletPage";
const NAV = [
    { key: "dashboard", label: "Dashboard" },
    { key: "wallet", label: "Wallet" },
    { key: "trade", label: "Trade" },
    { key: "transactions", label: "History" },
    { key: "contacts", label: "Contacts" },
    { key: "alerts", label: "Alerts" },
    { key: "settings", label: "Settings" },
];
// Normalizes the URL hash into a route key used to render the correct page.
function getRouteFromHash() {
    const clean = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
    return clean || "dashboard";
}
// Renders the full app shell (sidebar + header) and the page body based on the current route.
function MainApp({ route }) {
    const { prices, lastUpdated, error } = useLivePrices();
    const renderPage = () => {
        switch (route) {
            case "dashboard":
                return (_jsx(DashboardPage, { prices: prices, lastUpdated: lastUpdated, priceError: error }));
            case "wallet":
                return _jsx(WalletPage, {});
            case "trade":
                return _jsx(TradePage, {});
            case "transactions":
            case "history":
                return _jsx(TransactionsPage, {});
            case "contacts":
                return _jsx(ContactsPage, {});
            case "alerts":
                return _jsx(AlertsPage, {});
            case "settings":
                return _jsx(SettingsPage, {});
            default:
                return _jsx(NotFoundPage, {});
        }
    };
    const pageTitle = NAV.find((item) => item.key === route)?.label ?? "Not Found";
    return (_jsxs("main", { className: "app-shell", children: [_jsxs("aside", { className: "sidebar card", children: [_jsxs("div", { children: [_jsx("h1", { className: "brand", children: "Crypto Wallet" }), _jsxs("nav", { className: "side-nav", children: [_jsx("a", { href: "#/login", children: "Login" }), _jsx("a", { href: "#/signup", children: "Sign up" }), NAV.map((item) => (_jsx("a", { href: `#/${item.key}`, className: route === item.key ? "active" : "", children: item.label }, item.key)))] })] }), _jsxs("div", { className: "user-block", children: [_jsx("div", { className: "avatar" }), _jsx("span", { children: "Account" })] })] }), _jsxs("section", { className: "content", children: [_jsxs("header", { className: "content-header card", children: [_jsx("h2", { children: pageTitle }), _jsxs("div", { className: "header-actions", children: [_jsx("button", { type: "button", className: "chip", children: "Notifications" }), _jsx("button", { type: "button", className: "chip secondary", children: "Settings" })] })] }), renderPage()] })] }));
}
// Top-level route switch: when user navigates to #/login or #/signup, we hide the app shell.
export function App() {
    const [route, setRoute] = useState(getRouteFromHash());
    useEffect(() => {
        const onHashChange = () => setRoute(getRouteFromHash());
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);
    if (route === "login") {
        return _jsx(LoginPage, {});
    }
    if (route === "signup") {
        return _jsx(SignUpPage, {});
    }
    return _jsx(MainApp, { route: route });
}
