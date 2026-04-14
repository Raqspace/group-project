import { useCallback, useEffect, useRef, useState } from "react";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { useTutorialProfile } from "../context/TutorialProfileContext";
import { useAutoStartPageTour } from "../hooks/useAutoStartPageTour";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { supabase } from "../services/supabaseClient";
import { useListenTour } from "../utils/tourBus";
import { withPersonalizedLead } from "../utils/tutorialProfile";

type TradeType = "buy" | "sell";
type CoinSymbol = "BTC" | "ETH" | "XRP";

interface Prices {
  BTC: number | null;
  ETH: number | null;
  XRP: number | null;
}

interface Holding {
  symbol: string;
  amount: number;
}

const COINS: CoinSymbol[] = ["BTC", "ETH", "XRP"];

export function TradePage() {
  const [tradeType, setTradeType] = useState<TradeType>("buy");
  const [selectedCoin, setSelectedCoin] = useState<CoinSymbol>("BTC");
  const [amountGBP, setAmountGBP] = useState("");
  const [amountCoin, setAmountCoin] = useState("");
  const [prices, setPrices] = useState<Prices>({ BTC: null, ETH: null, XRP: null });
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [gbpBalance, setGbpBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const workflowRef = useRef<HTMLDivElement>(null);
  const balancesRef = useRef<HTMLDivElement>(null);
  const pricesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const { profile } = useTutorialProfile();
  const tour = useWalkthroughTour();
  const startTour = useCallback(() => tour.start(), [tour.start]);
  useListenTour("trade", startTour);
  useAutoStartPageTour("trade", startTour);

  useEffect(() => {
    fetchPrices();
    fetchHoldings();
  }, []);

  const fetchPrices = async () => {
    setPriceLoading(true);
    try {
      const res = await fetch("https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,XRP&tsyms=GBP");
      const data = await res.json();
      setPrices({
        BTC: data.BTC.GBP,
        ETH: data.ETH.GBP,
        XRP: data.XRP.GBP,
      });
    } catch {
      setError("Could not fetch prices.");
    } finally {
      setPriceLoading(false);
    }
  };

  const fetchHoldings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: wallet } = await supabase.from("Wallet").select("id, balance").eq("user_id", user.id).single();

    if (!wallet) return;

    setGbpBalance(Number(wallet.balance));

    const { data } = await supabase.from("holdings").select("symbol, amount").eq("wallet_id", wallet.id);

    if (data) setHoldings(data);
  };

  const getHolding = (symbol: string) => {
    const h = holdings.find((h) => h.symbol === symbol);
    return h ? Number(h.amount) : 0;
  };

  const currentPrice = prices[selectedCoin];

  const calculateCoinFromGBP = (): number | null => {
    if (!currentPrice || !amountGBP || isNaN(Number(amountGBP))) return null;
    return Number(amountGBP) / currentPrice;
  };

  const calculateGBPFromCoin = (): number | null => {
    if (!currentPrice || !amountCoin || isNaN(Number(amountCoin))) return null;
    return Number(amountCoin) * currentPrice;
  };

  const validate = (): string | null => {
    if (!currentPrice) return "Price not loaded yet";

    if (tradeType === "buy") {
      if (!amountGBP || isNaN(Number(amountGBP))) return "Enter a valid GBP amount";
      if (Number(amountGBP) <= 0) return "Amount must be greater than 0";
      if (Number(amountGBP) > gbpBalance) {
        return `Not enough GBP. You have £${gbpBalance.toFixed(2)}. Deposit first.`;
      }
    } else {
      if (!amountCoin || isNaN(Number(amountCoin))) return `Enter a valid ${selectedCoin} amount`;
      if (Number(amountCoin) <= 0) return "Amount must be greater than 0";
      if (Number(amountCoin) > getHolding(selectedCoin)) {
        return `Insufficient ${selectedCoin}. You have ${getHolding(selectedCoin).toFixed(6)} ${selectedCoin}`;
      }
    }
    return null;
  };

  const handleTrade = async () => {
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in");
        return;
      }

      const { data: wallet } = await supabase.from("Wallet").select("id, balance").eq("user_id", user.id).single();

      if (!wallet) {
        setError("Wallet not found");
        return;
      }

      const gbpAmount = tradeType === "buy" ? Number(amountGBP) : calculateGBPFromCoin()!;
      const coinAmount = tradeType === "buy" ? calculateCoinFromGBP()! : Number(amountCoin);

      const newBalance = tradeType === "buy" ? wallet.balance - gbpAmount : wallet.balance + gbpAmount;

      await supabase.from("Wallet").update({ balance: newBalance }).eq("id", wallet.id);

      const { data: holding } = await supabase
        .from("holdings")
        .select("id, amount")
        .eq("wallet_id", wallet.id)
        .eq("symbol", selectedCoin)
        .single();

      if (holding) {
        const newAmount =
          tradeType === "buy" ? Number(holding.amount) + coinAmount : Number(holding.amount) - coinAmount;

        await supabase.from("holdings").update({ amount: newAmount }).eq("id", holding.id);
      } else if (tradeType === "buy") {
        await supabase.from("holdings").insert({ wallet_id: wallet.id, symbol: selectedCoin, amount: coinAmount });
      }

      await supabase.from("trades").insert({
        user_id: user.id,
        type: tradeType,
        asset: selectedCoin,
        amount_gbp: gbpAmount,
        amount_btc: coinAmount,
        price_at_trade: currentPrice,
      });

      setSuccess(
        tradeType === "buy"
          ? `Bought ${coinAmount.toFixed(6)} ${selectedCoin} for £${gbpAmount.toFixed(2)}`
          : `Sold ${coinAmount.toFixed(6)} ${selectedCoin} for £${gbpAmount.toFixed(2)}`
      );
      setAmountGBP("");
      setAmountCoin("");
      fetchHoldings();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Trade failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", position: "relative" }}>
      <div ref={workflowRef} className="card" style={{ marginBottom: "0.9rem" }}>
        <p style={{ margin: 0, fontSize: "0.72rem", color: "#666764", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Your place in the flow
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginTop: "0.65rem" }}>
          <a href="#/deposit" className="chip secondary">
            1 · Deposit GBP
          </a>
          <span style={{ color: "#8a8a85" }}>→</span>
          <span className="chip" style={{ cursor: "default" }}>
            2 · Trade
          </span>
          <span style={{ color: "#8a8a85" }}>→</span>
          <a href="#/portfolio" className="chip secondary">
            3 · Portfolio
          </a>
        </div>
        <p className="live-note" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
          <strong>Buy</strong> spends your GBP and adds crypto to holdings. <strong>Sell</strong> does the reverse. Prices here are in{" "}
          <strong>£</strong> (GBP). Need cash?{" "}
          <a href="#/deposit" style={{ color: "#1f3c34", fontWeight: 600 }}>
            Deposit
          </a>
          .
        </p>
      </div>

      <div ref={balancesRef} className="card" style={{ marginBottom: "0.9rem" }}>
        <div style={{ fontSize: "0.72rem", color: "#666764", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Balances for trading
        </div>
        <p style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 700, color: "#2f5247" }}>
          GBP (for buys): £{gbpBalance.toFixed(2)}
        </p>
        {gbpBalance < 1 ? (
          <p className="live-note" style={{ margin: "0 0 12px" }}>
            Add GBP on <a href="#/deposit">Deposit</a> before you can buy.
          </p>
        ) : null}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {COINS.map((coin) => (
            <div
              key={coin}
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#f8f8f4",
                border: "1px solid #cdcdc7",
                borderRadius: 10,
                padding: "10px 14px",
                minWidth: 100,
              }}
            >
              <span style={{ fontSize: 12, color: "#656663", fontWeight: 600 }}>{coin}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#2e2e2d" }}>{getHolding(coin).toFixed(coin === "XRP" ? 2 : 6)}</span>
              <span style={{ fontSize: 12, color: "#2f5247", marginTop: 2 }}>
                {prices[coin] != null ? `~£${(getHolding(coin) * prices[coin]!).toFixed(2)}` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div ref={pricesRef} className="card" style={{ marginBottom: "0.9rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "#666764", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Live prices (GBP)
          </span>
          <button type="button" className="chip secondary" onClick={fetchPrices} disabled={priceLoading} style={{ cursor: "pointer" }}>
            {priceLoading ? "…" : "Refresh"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          {COINS.map((coin) => (
            <div
              key={coin}
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#ecece8",
                border: "1px solid #cdcdc7",
                borderRadius: 10,
                padding: "10px 14px",
                minWidth: 100,
              }}
            >
              <span style={{ fontSize: 12, color: "#656663", fontWeight: 600 }}>{coin}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#b45309" }}>
                {prices[coin] ? `£${prices[coin]!.toLocaleString()}` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div ref={formRef} className="card">
        <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid #cdcdc7", marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => {
              setTradeType("buy");
              setAmountGBP("");
              setAmountCoin("");
              setError(null);
              setSuccess(null);
            }}
            style={{
              flex: 1,
              padding: 10,
              border: "none",
              background: tradeType === "buy" ? "#2f5247" : "#f3f3ef",
              color: tradeType === "buy" ? "#fff" : "#454642",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => {
              setTradeType("sell");
              setAmountGBP("");
              setAmountCoin("");
              setError(null);
              setSuccess(null);
            }}
            style={{
              flex: 1,
              padding: 10,
              border: "none",
              background: tradeType === "sell" ? "#b91c1c" : "#f3f3ef",
              color: tradeType === "sell" ? "#fff" : "#454642",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sell
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="live-note" style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#454642" }}>
            Coin
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COINS.map((coin) => (
              <button
                key={coin}
                type="button"
                onClick={() => {
                  setSelectedCoin(coin);
                  setAmountGBP("");
                  setAmountCoin("");
                  setError(null);
                  setSuccess(null);
                }}
                className={selectedCoin === coin ? "chip" : "chip secondary"}
                style={{ cursor: "pointer" }}
              >
                {coin}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          {tradeType === "buy" ? (
            <>
              <label className="live-note" style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#454642" }}>
                Spend (£)
              </label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={amountGBP}
                onChange={(e) => {
                  setAmountGBP(e.target.value);
                  setError(null);
                  setSuccess(null);
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #cdcdc7",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                }}
                min={1}
              />
              {calculateCoinFromGBP() !== null ? (
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    background: "#d6ece4",
                    border: "1px solid #87a69a",
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginTop: 8,
                    fontSize: "0.9rem",
                    color: "#2f5247",
                  }}
                >
                  <span>You get</span>
                  <strong>
                    {calculateCoinFromGBP()!.toFixed(6)} {selectedCoin}
                  </strong>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <label className="live-note" style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#454642" }}>
                Sell amount ({selectedCoin})
              </label>
              <input
                type="number"
                placeholder="e.g. 0.001"
                value={amountCoin}
                onChange={(e) => {
                  setAmountCoin(e.target.value);
                  setError(null);
                  setSuccess(null);
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #cdcdc7",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                }}
                min={0}
                step="any"
              />
              <p className="live-note" style={{ marginTop: 6 }}>
                Available: {getHolding(selectedCoin).toFixed(6)} {selectedCoin}
              </p>
              {calculateGBPFromCoin() !== null ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    background: "#d6ece4",
                    border: "1px solid #87a69a",
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginTop: 8,
                    fontSize: "0.9rem",
                    color: "#2f5247",
                  }}
                >
                  <span>You get</span>
                  <strong>£{calculateGBPFromCoin()!.toFixed(2)}</strong>
                </div>
              ) : null}
            </>
          )}
        </div>

        {error ? <p className="live-error">{error}</p> : null}
        {success ? (
          <p style={{ color: "#2f5247", fontWeight: 600, marginBottom: 12 }}>
            {success}{" "}
            <a href="#/portfolio" style={{ color: "#1f3c34" }}>
              View Portfolio →
            </a>
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleTrade}
          disabled={loading || priceLoading}
          style={{
            width: "100%",
            padding: 12,
            border: "none",
            borderRadius: 10,
            color: "#fff",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: loading || priceLoading ? "not-allowed" : "pointer",
            opacity: loading || priceLoading ? 0.65 : 1,
            background: tradeType === "buy" ? "#2f5247" : "#b91c1c",
          }}
        >
          {loading
            ? "Working…"
            : tradeType === "buy"
              ? `Buy ${selectedCoin} with £${amountGBP || "0"}`
              : `Sell ${amountCoin || "0"} ${selectedCoin}`}
        </button>
      </div>

      {tour.step === 0 ? (
        <WalkthroughPopup
          anchorRef={workflowRef}
          title="Trade in the flow"
          body={withPersonalizedLead(
            profile,
            "trade",
            "You are on step 2. Deposit adds GBP. Here you swap GBP ↔ crypto. Portfolio shows results in USD."
          )}
          onClose={tour.finish}
          onNext={tour.next}
          showNext
          stepLabel="1 / 3"
        />
      ) : null}
      {tour.step === 1 ? (
        <WalkthroughPopup
          anchorRef={balancesRef}
          title="What you can spend"
          body="GBP pays for buys. Coin amounts are what you already own. Sell returns GBP to the same balance."
          onClose={tour.finish}
          onNext={tour.next}
          showNext
          stepLabel="2 / 3"
        />
      ) : null}
      {tour.step === 2 ? (
        <WalkthroughPopup
          anchorRef={formRef}
          title="Buy or sell"
          body="Pick coin, type £ to spend or coins to sell, confirm. Quotes use GBP from the price row above."
          onClose={tour.finish}
          onNext={tour.finish}
          showNext
          nextLabel="Done"
          stepLabel="3 / 3"
        />
      ) : null}
    </div>
  );
}
