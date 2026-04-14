import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useLivePrices } from "../hooks/useLivePrices";
import { buildUnitPrices } from "../utils/unitPrices";
import { AlertsPage } from "../pages/AlertsPage";
import { ContactsPage } from "../pages/ContactsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DemoPage } from "../pages/DemoPage";
import { DepositPage } from "../pages/DepositPage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PortfolioPage } from "../pages/PortfolioPage";
import { SettingsPage } from "../pages/SettingsPage";
import { SignUpPage } from "../pages/SignUpPage";
import { TradePage } from "../pages/TradePage";
import { TransactionsPage } from "../pages/TransactionsPage";
import { WalletPage } from "../pages/WalletPage";
import { supabase } from "../services/supabaseClient";
import { requestTour } from "../utils/tourBus";
const NAV = [
    { key: "dashboard", label: "Dashboard" },
    { key: "wallet", label: "Wallet" },
    { key: "portfolio", label: "Portfolio" },
    { key: "deposit", label: "Deposit" },
    { key: "trade", label: "Trade" },
    { key: "transactions", label: "History" },
    { key: "contacts", label: "Contacts" },
    { key: "alerts", label: "Alerts" },
    { key: "settings", label: "Settings" },
];
function getRouteFromHash() {
    const clean = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
    return clean || "home";
}
function MainApp({ route }) {
    const { prices, lastUpdated, error } = useLivePrices();
    const [xrpUsd, setXrpUsd] = useState(0);
    const [user, setUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [hasWallet, setHasWallet] = useState(false);
    useEffect(() => {
        let cancelled = false;
        fetch("https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd")
            .then((r) => r.json())
            .then((j) => {
            if (!cancelled && typeof j?.ripple?.usd === "number") {
                setXrpUsd(j.ripple.usd);
            }
        })
            .catch(() => {
            if (!cancelled)
                setXrpUsd(0.5);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        supabase.auth.getUser().then(async ({ data }) => {
            setUser(data.user);
            if (data.user) {
                const { data: walletData } = await supabase
                    .from("Wallet")
                    .select("id")
                    .eq("user_id", data.user.id)
                    .single();
                setHasWallet(!!walletData);
            }
            setAuthChecked(true);
        });
    }, []);
    useEffect(() => {
        if (authChecked && !user) {
            window.location.hash = "#/home";
        }
    }, [authChecked, user]);
    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.hash = "#/login";
    };
    const unitPrices = useMemo(() => buildUnitPrices(prices, xrpUsd), [prices, xrpUsd]);
    const renderPage = () => {
        switch (route) {
            case "dashboard":
                return (_jsx(DashboardPage, { prices: prices, unitPrices: unitPrices, lastUpdated: lastUpdated, priceError: error }));
            case "wallet":
                return _jsx(WalletPage, {});
            case "portfolio":
                return _jsx(PortfolioPage, { unitPrices: unitPrices });
            case "deposit":
                return _jsx(DepositPage, {});
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
    const tipPages = ["dashboard", "portfolio", "wallet", "deposit", "trade"];
    const showPageTips = user && tipPages.includes(route);
    if (!authChecked) {
        return null;
    }
    return (_jsxs("main", { className: "app-shell", children: [_jsxs("aside", { className: "sidebar card", children: [_jsxs("div", { children: [_jsx("h1", { className: "brand", children: "Crypto Wallet" }), _jsx("nav", { className: "side-nav", children: user ? (_jsxs(_Fragment, { children: [_jsx("button", { onClick: handleLogout, children: "Logout" }), NAV.map((item) => (_jsx("a", { href: `#/${item.key}`, className: route === item.key ? "active" : "", children: item.label }, item.key)))] })) : (_jsxs(_Fragment, { children: [_jsx("a", { href: "#/home", className: route === "home" ? "active" : "", children: "Home" }), _jsx("a", { href: "#/login", children: "Login" }), _jsx("a", { href: "#/signup", children: "Sign up" })] })) })] }), _jsxs("div", { className: "user-block", children: [_jsx("div", { className: "avatar" }), _jsx("span", { children: user ? user.email : "Account" })] })] }), _jsxs("section", { className: "content", children: [_jsxs("header", { className: "content-header card", children: [_jsx("h2", { children: pageTitle }), _jsxs("div", { className: "header-actions", children: [showPageTips ? (_jsx("button", { type: "button", className: "chip secondary", title: "Replay short explanations for this screen", onClick: () => requestTour(route), children: "Page tips" })) : null, _jsx("button", { type: "button", className: "chip", children: "Notifications" }), _jsx("button", { type: "button", className: "chip secondary", children: "Settings" })] })] }), renderPage()] })] }));
}
export function App() {
    const [route, setRoute] = useState(getRouteFromHash());
    useEffect(() => {
        const onHashChange = () => setRoute(getRouteFromHash());
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, [route]);
    if (route === "login") {
        return _jsx(LoginPage, {});
    }
    if (route === "signup") {
        return _jsx(SignUpPage, {});
    }
    if (route === "home") {
        return _jsx(LandingPage, {});
    }
    if (route === "demo") {
        return _jsx(DemoPage, {});
    }
    return _jsx(MainApp, { route: route });
}
