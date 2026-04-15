import { useCallback, useEffect, useRef, useState } from "react";
import { BtcSparkline7d, PortfolioAllocationBar } from "../components/dashboard/DashboardCharts";
import type { LivePricesUsd } from "../services/prices/priceService";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { useTutorialProfile } from "../context/TutorialProfileContext";
import { useAutoStartPageTour } from "../hooks/useAutoStartPageTour";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { supabase } from "../services/supabaseClient";
import { useListenTour } from "../utils/tourBus";
import { withPersonalizedLead } from "../utils/tutorialProfile";
import type { UnitPricesUsd } from "../utils/unitPrices";
import { portfolioTotalUsd } from "../utils/unitPrices";

const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatGbp = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const SPOT_SYMBOLS: (keyof LivePricesUsd)[] = ["BTC", "ETH", "USDT"];

type DashboardPageProps = {
  prices: LivePricesUsd;
  unitPrices: UnitPricesUsd;
  lastUpdated: Date | null;
  priceError: string;
};

type HoldingRow = { id: string; symbol: string; amount: number };

type RecentTradeRow = {
  id: string;
  type: "buy" | "sell";
  asset: string;
  amount_gbp: number;
  amount_btc: number;
  created_at?: string;
};

function downsamplePrices(points: [number, number][], maxPoints: number): [number, number][] {
  if (points.length <= maxPoints) return points;
  const step = points.length / maxPoints;
  const out: [number, number][] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.min(Math.floor(i * step), points.length - 1);
    out.push(points[idx]!);
  }
  return out;
}

function unitToPriceMap(u: UnitPricesUsd): Record<string, number> {
  return { BTC: u.BTC, ETH: u.ETH, XRP: u.XRP, USDT: u.USDT };
}

export function DashboardPage({ prices, unitPrices, lastUpdated, priceError }: DashboardPageProps) {
  const statRef = useRef<HTMLElement>(null);
  const chartRef = useRef<HTMLElement>(null);
  const holdingsRef = useRef<HTMLElement>(null);

  const [holdings, setHoldings] = useState<HoldingRow[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [btcSeries, setBtcSeries] = useState<[number, number][]>([]);
  const [btcChartLoading, setBtcChartLoading] = useState(true);
  const [btcChartError, setBtcChartError] = useState("");

  const [recentTrades, setRecentTrades] = useState<RecentTradeRow[]>([]);
  const [recentTradesLoading, setRecentTradesLoading] = useState(true);
  const [recentTradesError, setRecentTradesError] = useState("");

  const { profile } = useTutorialProfile();

  const tour = useWalkthroughTour();
  const startTour = useCallback(() => tour.start(), [tour.start]);
  useListenTour("dashboard", startTour);
  useAutoStartPageTour("dashboard", startTour);

  const priceMapForHoldings = unitToPriceMap(unitPrices);
  const totalUsd = portfolioTotalUsd(holdings, unitPrices);

  useEffect(() => {
    let cancelled = false;

    const loadHoldings = async () => {
      setDashboardLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        setDashboardLoading(false);
        return;
      }

      const { data: walletData } = await supabase.from("Wallet").select("id").eq("user_id", user.id).single();

      if (!walletData || cancelled) {
        setHoldings([]);
        setDashboardLoading(false);
        return;
      }

      const { data: rows } = await supabase.from("holdings").select("id, symbol, amount").eq("wallet_id", walletData.id);

      if (!cancelled && rows) {
        setHoldings(rows as HoldingRow[]);
      }

      if (!cancelled) setDashboardLoading(false);
    };

    const loadBtcChart = async () => {
      setBtcChartLoading(true);
      setBtcChartError("");
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7"
        );
        if (!res.ok) throw new Error("Chart request failed");
        const j = await res.json();
        const raw: [number, number][] = j.prices ?? [];
        if (!cancelled) {
          setBtcSeries(downsamplePrices(raw, 72));
        }
      } catch {
        if (!cancelled) {
          setBtcChartError("Could not load 7 day BTC chart.");
          setBtcSeries([]);
        }
      } finally {
        if (!cancelled) setBtcChartLoading(false);
      }
    };

    const loadRecentTrades = async () => {
      setRecentTradesLoading(true);
      setRecentTradesError("");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || cancelled) {
          if (!cancelled) {
            setRecentTrades([]);
            setRecentTradesLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from("trades")
          .select("id, type, asset, amount_gbp, amount_btc, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw error;

        if (!cancelled) {
          setRecentTrades((data as RecentTradeRow[]) ?? []);
        }
      } catch {
        if (!cancelled) {
          setRecentTradesError("Could not load recent transactions.");
          setRecentTrades([]);
        }
      } finally {
        if (!cancelled) setRecentTradesLoading(false);
      }
    };

    loadHoldings();
    loadBtcChart();
    loadRecentTrades();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section ref={statRef} className="stat-row card">
        <article className="stat-card">
          <p>Portfolio total (USD)</p>
          <strong>{dashboardLoading ? "…" : totalUsd > 0 ? formatUsd(totalUsd) : "—"}</strong>
          <p style={{ margin: "0.45rem 0 0", fontSize: "0.78rem", color: "#656663", fontWeight: 500 }}>
            Sum of every coin below × today’s USD price. Same math as Portfolio.
          </p>
        </article>

        {SPOT_SYMBOLS.map((symbol) => (
          <article key={symbol} className="stat-card">
            <p>{symbol} market price</p>
            <strong>{formatUsd(prices[symbol])}</strong>
            <p style={{ margin: "0.45rem 0 0", fontSize: "0.75rem", color: "#8a8a85" }}>
              Public quote only. Not added into your total again.
            </p>
          </article>
        ))}
      </section>

      <section className="middle-row">
        <article ref={chartRef} className="main-panel card">
          <h3>How your coins split (and a BTC price graph)</h3>
          <p className="live-note" style={{ marginTop: 0, marginBottom: 12 }}>
            The <strong>colored bar</strong> is <em>your</em> simulator holdings only. The <strong>orange line</strong> is Bitcoin’s
            price on the open market over the last week. That line is for learning what charts look like. It is not your balance and
            it does not change when you press Send.
          </p>

          {dashboardLoading ? (
            <p className="live-note">Loading your holdings…</p>
          ) : (
            <PortfolioAllocationBar holdings={holdings} prices={priceMapForHoldings} />
          )}

          <BtcSparkline7d points={btcSeries} loading={btcChartLoading} error={btcChartError} />

          <p className="live-note" style={{ marginTop: 12 }}>
            {lastUpdated ? `App price feed updated ${lastUpdated.toLocaleTimeString()}` : "Loading live prices..."}
          </p>

          {priceError ? <p className="live-error">{priceError}</p> : null}
        </article>

        <article ref={holdingsRef} className="side-panel card">
          <h3>Holdings (same rows as Portfolio)</h3>
          <p style={{ margin: "0 0 10px", fontSize: "0.82rem", color: "#656663" }}>
            Left: how many coins you own. Right: that stack in USD (amount × price). Add the right column: it equals Portfolio total.
          </p>

          {dashboardLoading ? (
            <p className="live-note">Loading…</p>
          ) : holdings.length === 0 ? (
            <p className="live-note">No wallet yet. Create one under Wallet.</p>
          ) : (
            <>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {holdings.map((h) => {
                  const px = priceMapForHoldings[h.symbol] ?? 0;
                  const usd = h.amount * px;
                  return (
                    <li
                      key={h.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        padding: "8px 0",
                        borderBottom: "1px solid #d9d9d2",
                        fontSize: "0.9rem",
                      }}
                    >
                      <span>
                        <strong>{h.symbol}</strong>
                        <span style={{ color: "#656663", marginLeft: 6 }}>{h.amount} units</span>
                      </span>
                      <span style={{ fontWeight: 600 }}>{formatUsd(usd)}</span>
                    </li>
                  );
                })}
              </ul>

              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "2px solid #cfcec8",
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                }}
              >
                <span>Total (check vs strip above)</span>
                <span>{formatUsd(totalUsd)}</span>
              </div>
            </>
          )}
        </article>
      </section>

      <section className="bottom-row card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ marginBottom: 4 }}>Recent Transactions</h3>
            <p className="live-note" style={{ marginTop: 0 }}>
              Your most recent completed trade.
            </p>
          </div>
          <a href="#/transactions" className="chip secondary" style={{ textDecoration: "none" }}>
            View full history
          </a>
        </div>

        {recentTradesLoading ? (
          <p className="live-note" style={{ marginTop: 12 }}>
            Loading recent transaction...
          </p>
        ) : recentTradesError ? (
          <p className="live-error" style={{ marginTop: 12 }}>
            {recentTradesError}
          </p>
        ) : recentTrades.length === 0 ? (
          <p className="live-note" style={{ marginTop: 12 }}>
            No trades yet. Go to Trade to make your first buy or sell.
          </p>
        ) : (
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
            <tbody>
              {(() => {
                const trade = recentTrades[0];
                return (
                  <tr key={trade.id}>
                    <td style={{ textTransform: "capitalize", fontWeight: 600 }}>
                      {trade.type}
                    </td>
                    <td>{formatDateTime(trade.created_at)}</td>
                    <td>{trade.asset}</td>
                    <td>
                      {Number(trade.amount_btc).toFixed(trade.asset === "XRP" ? 2 : 6)} {trade.asset} ·{" "}
                      {formatGbp(Number(trade.amount_gbp))}
                    </td>
                    <td>Completed</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        )}
      </section>

      {tour.step === 0 ? (
        <WalkthroughPopup
          anchorRef={statRef}
          title="Your total vs market prices"
          body={withPersonalizedLead(
            profile,
            "dashboard",
            "Big number = all your pretend coins added up in dollars (same math as Portfolio). The three small cards are just today’s BTC, ETH, USDT prices to read. They are not extra cash on top of your total."
          )}
          onClose={tour.finish}
          onNext={tour.next}
          showNext
          stepLabel="1 / 3"
        />
      ) : null}

      {tour.step === 1 ? (
        <WalkthroughPopup
          anchorRef={chartRef}
          title="Bar vs orange line"
          body="Colored bar = how your own portfolio is split (BTC, ETH, XRP…). Orange line = Bitcoin’s public price this week only. It is like a stock chart for learning, not your balance."
          onClose={tour.finish}
          onNext={tour.next}
          showNext
          stepLabel="2 / 3"
        />
      ) : null}

      {tour.step === 2 ? (
        <WalkthroughPopup
          anchorRef={holdingsRef}
          title="This list is the proof"
          body="Each row: units × price = dollars on the right. Add those dollars and you get the big total above (and Portfolio’s total too)."
          onClose={tour.finish}
          onNext={tour.finish}
          showNext
          nextLabel="Done"
          stepLabel="3 / 3"
        />
      ) : null}
    </>
  );
}
