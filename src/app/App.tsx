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
import { requestTour, type TourPage } from "../utils/tourBus";

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
] as const;

function getRouteFromHash() {
  const clean = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
  return clean || "home";
}

type MainAppProps = { route: string };

function MainApp({ route }: MainAppProps) {
  const { prices, lastUpdated, error } = useLivePrices();
  const [xrpUsd, setXrpUsd] = useState(0);
  const [user, setUser] = useState<any>(null);
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
        if (!cancelled) setXrpUsd(0.5);
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
          .single()
        setHasWallet(!!walletData)
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
  }

  const unitPrices = useMemo(() => buildUnitPrices(prices, xrpUsd), [prices, xrpUsd]);

  const renderPage = () => {
    switch (route) {
      case "dashboard":
        return (
          <DashboardPage
            prices={prices}
            unitPrices={unitPrices}
            lastUpdated={lastUpdated}
            priceError={error}
          />
        );
      case "wallet":
        return <WalletPage />;
      case "portfolio":
        return <PortfolioPage unitPrices={unitPrices} />;
      case "deposit":
        return <DepositPage />;
      case "trade":
        return <TradePage />;
      case "transactions":
      case "history":
        return <TransactionsPage />;
      case "contacts":
        return <ContactsPage />;
      case "alerts":
        return <AlertsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <NotFoundPage />;
    }
  };

  const pageTitle = NAV.find((item) => item.key === route)?.label ?? "Not Found";

  const tipPages: TourPage[] = ["dashboard", "portfolio", "wallet"];
  const showPageTips = user && tipPages.includes(route as TourPage);

  if (!authChecked) {
    return null;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar card">
        <div>
          <h1 className="brand">Crypto Wallet</h1>
          <nav className="side-nav">
            {user ? (
              <>
                <button onClick={handleLogout}>Logout</button>
                {NAV.map((item) => (
                  <a key={item.key} href={`#/${item.key}`} className={route === item.key ? "active" : ""}>
                    {item.label}
                  </a>
                ))}
              </>
            ) : (
              <>
                <a href="#/home" className={route === "home" ? "active" : ""}>Home</a>
                <a href="#/login">Login</a>
                <a href="#/signup">Sign up</a>
              </>
            )}
          </nav>
        </div>
        <div className="user-block">
          <div className="avatar" />
          <span>{user ? user.email : "Account"}</span>
        </div>
      </aside>

      <section className="content">
        <header className="content-header card">
          <h2>{pageTitle}</h2>
          <div className="header-actions">
            {showPageTips ? (
              <button
                type="button"
                className="chip secondary"
                title="Replay short explanations for this screen"
                onClick={() => requestTour(route as TourPage)}
              >
                Page tips
              </button>
            ) : null}
            <button type="button" className="chip">
              Notifications
            </button>
            <button type="button" className="chip secondary">
              Settings
            </button>
          </div>
        </header>
        {renderPage()}
      </section>
    </main>
  );
}

export function App() {
  const [route, setRoute] = useState(getRouteFromHash());

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [route]);

  if (route === "login") {
    return <LoginPage />;
  }

  if (route === "signup") {
    return <SignUpPage />;
  }

  if (route === "home") {
    return <LandingPage />;
  }

  if (route === "demo") {
    return <DemoPage />;
  }

  return <MainApp route={route} />;
}
