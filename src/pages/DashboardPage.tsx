import type { LivePricesUsd } from "../services/prices/priceService";

// Formats a number into a consistent USD string for the UI.
const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

const SPOT_SYMBOLS: (keyof LivePricesUsd)[] = ["BTC", "ETH", "USDT"];

type DashboardPageProps = {
  prices: LivePricesUsd;
  lastUpdated: Date | null;
  priceError: string;
};

// Renders the dashboard layout using live spot prices (CoinGecko) and placeholders for wallet data.
export function DashboardPage({ prices, lastUpdated, priceError }: DashboardPageProps) {
  return (
    <>
      <section className="stat-row card">
        <article className="stat-card">
          <p>Total Balance</p>
          <strong>PLACEHOLDER</strong>
        </article>
        {SPOT_SYMBOLS.map((symbol) => (
          <article key={symbol} className="stat-card">
            <p>{symbol} Price</p>
            <strong>{formatUsd(prices[symbol])}</strong>
          </article>
        ))}
      </section>

      <section className="middle-row">
        <article className="main-panel card">
          <h3>Chart Placeholder</h3>
          {/* Build your portfolio chart here later (e.g., holdings over time). */}
          <div className="chart-placeholder" />
          <p className="live-note">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Loading live prices..."}
          </p>
          {priceError ? <p className="live-error">{priceError}</p> : null}
        </article>

        <article className="side-panel card">
          <h3>Holdings</h3>
          <strong>PLACEHOLDER</strong>
        </article>
      </section>

      <section className="bottom-row card">
        <h3>Recent Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Date</th>
              <th>Asset</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody />
        </table>
      </section>
    </>
  );
}
