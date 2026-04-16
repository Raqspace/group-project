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
import { NotificationPage } from "../pages/NotificationPage";
import { PortfolioPage } from "../pages/PortfolioPage";
import { SettingsPage } from "../pages/SettingsPage";
import { SignUpPage } from "../pages/SignUpPage";
import { TradePage } from "../pages/TradePage";
import { TransactionsPage } from "../pages/TransactionsPage";
import { WalletPage } from "../pages/WalletPage";
import { NotificationCenter } from "../components/notifications/NotificationCenter";
import { TutorialProfileProvider } from "../context/TutorialProfileContext";
import { supabase } from "../services/supabaseClient";
import { clearTutorialSessionProfileCache, pickDisplayName } from "../utils/tutorialProfile";
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
  const raw = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
  const path = raw.split("?")[0]?.trim() ?? "";
  // If hash contains access_token it's a Supabase auth redirect, don't treat as a route
  if (raw.includes("access_token=")) return "home";
  return path || "home";
}

type MainAppProps = { route: string };

function routeToTourPage(route: string): TourPage | null {
  if (route === "history") return "transactions";
  const tipped: TourPage[] = [
    "dashboard", "portfolio", "wallet", "deposit",
    "trade", "transactions", "contacts", "alerts", "settings",
  ];
  return tipped.includes(route as TourPage) ? (route as TourPage) : null;
}

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
        if (!cancelled && typeof j?.ripple?.usd === "number") setXrpUsd(j.ripple.usd);
      })
      .catch(() => { if (!cancelled) setXrpUsd(0.5); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const applySession = async (sessionUser: typeof user) => {
      if (cancelled) return;
      setUser(sessionUser);

      if (sessionUser) {
        const { data: walletData } = await supabase
          .from("Wallet")
          .select("id")
          .eq("user_id", sessionUser.id)
          .single();
        if (!cancelled) setHasWallet(!!walletData);
      } else {
        setHasWallet(false);
      }

      setAuthChecked(true);
    };

    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      await applySession(session?.user ?? null);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session?.user ?? null);
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (authChecked && !user) window.location.hash = "#/home";
  }, [authChecked, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearTutorialSessionProfileCache();
    window.location.hash = "#/login";
  };

  const unitPrices = useMemo(() => buildUnitPrices(prices, xrpUsd), [prices, xrpUsd]);

  const renderPage = () => {
    switch (route) {
      case "dashboard":     return <DashboardPage prices={prices} unitPrices={unitPrices} lastUpdated={lastUpdated} priceError={error} />;
      case "wallet":        return <WalletPage />;
      case "portfolio":     return <PortfolioPage unitPrices={unitPrices} />;
      case "deposit":       return <DepositPage />;
      case "trade":         return <TradePage />;
      case "transactions":
      case "history":       return <TransactionsPage />;
      case "contacts":      return <ContactsPage />;
      case "alerts":        return <AlertsPage />;
      case "notifications": return <NotificationPage />;
      case "settings":      return <SettingsPage />;
      default:              return <NotFoundPage />;
    }
  };

  const pageTitle = NAV.find((item) => item.key === route)?.label ?? "Not Found";
  const activeTourPage = routeToTourPage(route);
  const showPageTips = Boolean(user && activeTourPage);

  if (!authChecked) {
    return (
      <main className="app-shell" aria-busy="true">
        <aside className="sidebar card" style={{ opacity: 0.72 }}>
          <h1 className="brand">Crypto Wallet</h1>
          <p className="live-note" style={{ marginTop: "1rem" }}>Loading your session…</p>
        </aside>
        <section className="content">
          <p className="live-note" style={{ padding: "1.5rem" }}>One moment — preparing your workspace.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar card">
        <div>
          <a href="#/dashboard" style={{ textDecoration: "none", color: "inherit" }}>
            <h1 className="brand">Crypto Wallet</h1>
          </a>
          <nav className="side-nav">
            {user ? (
              <>
                <button onClick={handleLogout}>Logout</button>
                {NAV.filter(item => item.key !== "wallet" || !hasWallet).map((item) => (
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
          {user ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, textAlign: "left" }}>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2 }}>{pickDisplayName(user)}</span>
              <span className="live-note" style={{ margin: 0, fontSize: "0.72rem", opacity: 0.85 }}>{user.email}</span>
            </div>
          ) : (
            <span>Account</span>
          )}
        </div>
      </aside>

      <section className="content">
        <TutorialProfileProvider user={user}>
          <header className="content-header card">
            <h2>{pageTitle}</h2>
            <div className="header-actions">
              {showPageTips && activeTourPage ? (
                <button
                  type="button"
                  className="chip secondary"
                  title="Replay short explanations for this screen"
                  onClick={() => requestTour(activeTourPage)}
                >
                  Page tips
                </button>
              ) : null}
              <NotificationCenter />
              <button type="button" className="chip secondary">Settings</button>
            </div>
          </header>
          {renderPage()}
        </TutorialProfileProvider>
      </section>
    </main>
  );
}

export function App() {
  const [route, setRoute] = useState(getRouteFromHash());

  // Handle Supabase email confirmation redirect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        window.location.hash = "#/dashboard";
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [route]);

  if (route === "login")  return <LoginPage />;
  if (route === "signup") return <SignUpPage />;
  if (route === "home")   return <LandingPage />;
  if (route === "demo")   return <DemoPage />;

  return <MainApp route={route} />;
}
