import { useCallback, useEffect, useRef, useState } from "react";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { useAutoStartPageTour } from "../hooks/useAutoStartPageTour";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { supabase } from "../services/supabaseClient";
import { useListenTour } from "../utils/tourBus";

type TradeRow = {
  id: string;
  type: "buy" | "sell";
  asset: string;
  amount_gbp: number;
  amount_btc: number;
  price_at_trade: number;
  created_at?: string;
};

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

export function TransactionsPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const tour = useWalkthroughTour();
  const startTour = useCallback(() => tour.start(), [tour]);
  useListenTour("transactions", startTour);
  useAutoStartPageTour("transactions", startTour);

  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrades = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setTrades([]);
        setLoading(false);
        return;
      }

      const { data, error: tradesError } = await supabase
        .from("trades")
        .select("id, type, asset, amount_gbp, amount_btc, price_at_trade, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (tradesError) {
        throw tradesError;
      }

      setTrades((data as TradeRow[]) ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load transaction history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrades();
  }, [loadTrades]);

  useEffect(() => {
    const targetRef = tour.step === 0 ? introRef : tour.step === 1 ? tableRef : null;
    targetRef?.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [tour.step]);

  const overviewCardStyle: React.CSSProperties = {
    marginBottom: "0.9rem",
  };

  const summaryGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "0.75rem",
    marginTop: "1rem",
  };

  const summaryCardStyle: React.CSSProperties = {
    background: "#f8f8f4",
    border: "1px solid #d0d0ca",
    borderRadius: 12,
    padding: "0.85rem 0.9rem",
  };

  const tableWrapStyle: React.CSSProperties = {
    overflowX: "auto",
    marginTop: "0.8rem",
  };

  const badgeStyle = (type: "buy" | "sell"): React.CSSProperties => ({
    display: "inline-block",
    minWidth: 58,
    textAlign: "center",
    padding: "0.28rem 0.55rem",
    borderRadius: 999,
    fontSize: "0.8rem",
    fontWeight: 700,
    color: type === "buy" ? "#2f5247" : "#991b1b",
    background: type === "buy" ? "#d6ece4" : "#fee2e2",
    border: type === "buy" ? "1px solid #87a69a" : "1px solid #fecaca",
    textTransform: "capitalize",
  });

  const buyCount = trades.filter((trade) => trade.type === "buy").length;
  const sellCount = trades.filter((trade) => trade.type === "sell").length;
  const totalTradeVolume = trades.reduce((sum, trade) => sum + Number(trade.amount_gbp || 0), 0);

  return (
    <div ref={rootRef} style={{ maxWidth: 860, display: "grid", gap: "0.9rem" }}>
      <div ref={introRef} className="card" style={overviewCardStyle}>
        <h3 style={{ marginTop: 0, marginBottom: "0.35rem" }}>History</h3>
        <p className="live-note" style={{ lineHeight: 1.55, marginTop: 0 }}>
          This screen shows completed trades recorded by your simulator account. Deposits and transfers can be added later if those actions
          also write to their own history tables.
        </p>

        <div style={summaryGridStyle}>
          <div style={summaryCardStyle}>
            <p style={{ margin: 0, color: "#5f6060", fontSize: "0.9rem" }}>Total trades</p>
            <strong style={{ display: "block", marginTop: 6, fontSize: "1.15rem" }}>{trades.length}</strong>
          </div>

          <div style={summaryCardStyle}>
            <p style={{ margin: 0, color: "#5f6060", fontSize: "0.9rem" }}>Buys</p>
            <strong style={{ display: "block", marginTop: 6, fontSize: "1.15rem" }}>{buyCount}</strong>
          </div>

          <div style={summaryCardStyle}>
            <p style={{ margin: 0, color: "#5f6060", fontSize: "0.9rem" }}>Sells</p>
            <strong style={{ display: "block", marginTop: 6, fontSize: "1.15rem" }}>{sellCount}</strong>
          </div>

          <div style={summaryCardStyle}>
            <p style={{ margin: 0, color: "#5f6060", fontSize: "0.9rem" }}>Trade volume</p>
            <strong style={{ display: "block", marginTop: 6, fontSize: "1.15rem" }}>{formatGbp(totalTradeVolume)}</strong>
          </div>
        </div>
      </div>

      <div ref={tableRef} className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: "0.25rem" }}>Recent activity</h3>
            <p className="live-note" style={{ marginTop: 0 }}>
              Latest trade first. Refresh after making a new buy or sell.
            </p>
          </div>

          <button type="button" className="chip secondary" onClick={() => void loadTrades()}>
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="live-note" style={{ marginTop: "1rem" }}>
            Loading history...
          </p>
        ) : error ? (
          <p className="live-error" style={{ marginTop: "1rem" }}>
            {error}
          </p>
        ) : trades.length === 0 ? (
          <div
            style={{
              marginTop: "1rem",
              border: "1px dashed #c7c6be",
              borderRadius: 12,
              padding: "1rem",
              background: "#fafaf7",
            }}
          >
            <p style={{ margin: 0, fontWeight: 700 }}>No trade history yet</p>
            <p className="live-note" style={{ marginTop: "0.45rem" }}>
              Once you buy or sell on the Trade page, completed transactions will appear here.
            </p>
            <a href="#/trade" className="chip" style={{ display: "inline-block", marginTop: "0.75rem", textDecoration: "none" }}>
              Open Trade
            </a>
          </div>
        ) : (
          <div style={tableWrapStyle}>
            <table>
              <thead>
                <tr>
                  <th style={{ paddingBottom: "0.55rem" }}>Type</th>
                  <th style={{ paddingBottom: "0.55rem" }}>Asset</th>
                  <th style={{ paddingBottom: "0.55rem" }}>Coin amount</th>
                  <th style={{ paddingBottom: "0.55rem" }}>Price</th>
                  <th style={{ paddingBottom: "0.55rem" }}>Total GBP</th>
                  <th style={{ paddingBottom: "0.55rem" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id}>
                    <td>
                      <span style={badgeStyle(trade.type)}>{trade.type}</span>
                    </td>
                    <td>{trade.asset}</td>
                    <td>
                      {Number(trade.amount_btc).toFixed(trade.asset === "XRP" ? 2 : 6)} {trade.asset}
                    </td>
                    <td>{formatGbp(Number(trade.price_at_trade))}</td>
                    <td>{formatGbp(Number(trade.amount_gbp))}</td>
                    <td>{formatDateTime(trade.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {tour.step === 0 ? (
        <WalkthroughPopup
          anchorRef={introRef}
          title="Transaction history"
          body="This page collects completed trade records for your account. It is the easiest place to review what you bought or sold over time."
          onClose={tour.finish}
          onNext={tour.next}
          showNext
          stepLabel="1 / 2"
        />
      ) : null}

      {tour.step === 1 ? (
        <WalkthroughPopup
          anchorRef={tableRef}
          title="Reading the table"
          body="Each row shows whether it was a buy or sell, which asset was traded, how much coin changed hands, the quoted GBP price, and the total value at that moment."
          onClose={tour.finish}
          onNext={tour.finish}
          showNext
          nextLabel="Done"
          stepLabel="2 / 2"
        />
      ) : null}
    </div>
  );
}