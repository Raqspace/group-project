import { useEffect, useState } from "react";
import { useLivePrices } from "../hooks/useLivePrices";
import { AlertsPage } from "../pages/AlertsPage";
import { ContactsPage } from "../pages/ContactsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PortfolioPage } from "../pages/PortfolioPage";
import { SettingsPage } from "../pages/SettingsPage";
import { SignUpPage } from "../pages/SignUpPage";
import { TradePage } from "../pages/TradePage";
import { TransactionsPage } from "../pages/TransactionsPage";
import { WalletPage } from "../pages/WalletPage";
import { supabase } from "../services/supabaseClient";

const NAV = [
  { key: "dashboard", label: "Dashboard" },
  { key: "wallet", label: "Wallet" },
  { key: "portfolio", label: "Portfolio" },
  { key: "trade", label: "Trade" },
  { key: "transactions", label: "History" },
  { key: "contacts", label: "Contacts" },
  { key: "alerts", label: "Alerts" },
  { key: "settings", label: "Settings" },
] as const;

function getRouteFromHash() {
  const clean = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
  return clean || "dashboard";
}

type MainAppProps = { route: string };

function MainApp({ route }: MainAppProps) {
  const { prices, lastUpdated, error } = useLivePrices();
  const [user, setUser] = useState<any>(null);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: walletData } = await supabase
          .from("Wallet")
          .select("id")
          .eq("user_id", data.user.id)
          .single()
        setHasWallet(!!walletData)
      }
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.hash = "#/login"
  }

  const renderPage = () => {
    switch (route) {
      case "dashboard":
        return (
          <DashboardPage
            prices={prices}
            lastUpdated={lastUpdated}
            priceError={error}
          />
        );
      case "wallet":
        return <WalletPage />;
      case "portfolio":
        return <PortfolioPage />;
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

  return (
    <main className="app-shell">
      <aside className="sidebar card">
        <div>
          <h1 className="brand">Crypto Wallet</h1>
          <nav className="side-nav">
            {user ? (
              <button onClick={handleLogout}>Logout</button>
            ) : (
              <>
                <a href="#/login">Login</a>
                <a href="#/signup">Sign up</a>
              </>
            )}
            {NAV.map((item) => {
              if (item.key === "wallet" && hasWallet) return null
              if (item.key === "portfolio" && !hasWallet) return null
              return (
                <a key={item.key} href={`#/${item.key}`} className={route === item.key ? "active" : ""}>
                  {item.label}
                </a>
              )
            })}
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

  return <MainApp route={route} />;
}