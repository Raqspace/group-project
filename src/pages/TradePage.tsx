import { useState, useEffect } from "react"
import { supabase } from "../services/supabaseClient"

type TradeType = "buy" | "sell"
type CoinSymbol = "BTC" | "ETH" | "XRP"

interface Prices {
  BTC: number | null
  ETH: number | null
  XRP: number | null
}

interface Holding {
  symbol: string
  amount: number
}

const COINS: CoinSymbol[] = ["BTC", "ETH", "XRP"]

export function TradePage() {
  const [tradeType, setTradeType] = useState<TradeType>("buy")
  const [selectedCoin, setSelectedCoin] = useState<CoinSymbol>("BTC")
  const [amountGBP, setAmountGBP] = useState("")
  const [amountCoin, setAmountCoin] = useState("")
  const [prices, setPrices] = useState<Prices>({ BTC: null, ETH: null, XRP: null })
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [gbpBalance, setGbpBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [priceLoading, setPriceLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchPrices()
    fetchHoldings()
  }, [])

  const fetchPrices = async () => {
    setPriceLoading(true)
    try {
      const res = await fetch(
        "https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,XRP&tsyms=GBP"
      )
      const data = await res.json()
      setPrices({
        BTC: data.BTC.GBP,
        ETH: data.ETH.GBP,
        XRP: data.XRP.GBP,
      })
    } catch {
      setError("Could not fetch prices.")
    } finally {
      setPriceLoading(false)
    }
  }

  const fetchHoldings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: wallet } = await supabase
      .from("Wallet")
      .select("id, balance")
      .eq("user_id", user.id)
      .single()

    if (!wallet) return

    setGbpBalance(wallet.balance)

    const { data } = await supabase
      .from("holdings")
      .select("symbol, amount")
      .eq("wallet_id", wallet.id)

    if (data) setHoldings(data)
  }

  const getHolding = (symbol: string) => {
    const h = holdings.find(h => h.symbol === symbol)
    return h ? Number(h.amount) : 0
  }

  const currentPrice = prices[selectedCoin]

  // Buy: GBP → crypto
  const calculateCoinFromGBP = (): number | null => {
    if (!currentPrice || !amountGBP || isNaN(Number(amountGBP))) return null
    return Number(amountGBP) / currentPrice
  }

  // Sell: crypto → GBP
  const calculateGBPFromCoin = (): number | null => {
    if (!currentPrice || !amountCoin || isNaN(Number(amountCoin))) return null
    return Number(amountCoin) * currentPrice
  }

  const validate = (): string | null => {
    if (!currentPrice) return "Price not loaded yet"

    if (tradeType === "buy") {
      if (!amountGBP || isNaN(Number(amountGBP))) return "Enter a valid GBP amount"
      if (Number(amountGBP) <= 0) return "Amount must be greater than 0"
      if (Number(amountGBP) > gbpBalance) {
        return `Insufficient GBP balance. You have £${gbpBalance.toFixed(2)}`
      }
    } else {
      if (!amountCoin || isNaN(Number(amountCoin))) return `Enter a valid ${selectedCoin} amount`
      if (Number(amountCoin) <= 0) return "Amount must be greater than 0"
      if (Number(amountCoin) > getHolding(selectedCoin)) {
        return `Insufficient ${selectedCoin}. You have ${getHolding(selectedCoin).toFixed(6)} ${selectedCoin}`
      }
    }
    return null
  }

  const handleTrade = async () => {
    setError(null)
    setSuccess(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError("You must be logged in"); return }

      const { data: wallet } = await supabase
        .from("Wallet")
        .select("id, balance")
        .eq("user_id", user.id)
        .single()

      if (!wallet) { setError("Wallet not found"); return }

      // For buy: use GBP input. For sell: calculate GBP from coin input
      const gbpAmount = tradeType === "buy"
        ? Number(amountGBP)
        : calculateGBPFromCoin()!

      const coinAmount = tradeType === "buy"
        ? calculateCoinFromGBP()!
        : Number(amountCoin)

      // Update Wallet.balance
      const newBalance = tradeType === "buy"
        ? wallet.balance - gbpAmount
        : wallet.balance + gbpAmount

      await supabase
        .from("Wallet")
        .update({ balance: newBalance })
        .eq("id", wallet.id)

      // Update holdings
      const { data: holding } = await supabase
        .from("holdings")
        .select("id, amount")
        .eq("wallet_id", wallet.id)
        .eq("symbol", selectedCoin)
        .single()

      if (holding) {
        const newAmount = tradeType === "buy"
          ? Number(holding.amount) + coinAmount
          : Number(holding.amount) - coinAmount

        await supabase
          .from("holdings")
          .update({ amount: newAmount })
          .eq("id", holding.id)
      } else if (tradeType === "buy") {
        await supabase
          .from("holdings")
          .insert({ wallet_id: wallet.id, symbol: selectedCoin, amount: coinAmount })
      }

      // Record the trade
      await supabase.from("trades").insert({
        user_id: user.id,
        type: tradeType,
        asset: selectedCoin,
        amount_gbp: gbpAmount,
        amount_btc: coinAmount,
        price_at_trade: currentPrice,
      })

      setSuccess(
        tradeType === "buy"
          ? `Bought ${coinAmount.toFixed(6)} ${selectedCoin} for £${gbpAmount.toFixed(2)}`
          : `Sold ${coinAmount.toFixed(6)} ${selectedCoin} for £${gbpAmount.toFixed(2)}`
      )
      setAmountGBP("")
      setAmountCoin("")
      fetchHoldings()

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Trade failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="content">
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "24px" }}>

          <h2>Trade</h2>

          {/* Portfolio */}
          <div style={s.card}>
            <div style={s.cardTitle}>Your Portfolio</div>
            <p style={{ fontSize: "14px", color: "#374151", marginBottom: "12px" }}>
              GBP Balance: <strong>£{gbpBalance.toFixed(2)}</strong>
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" as const }}>
              {COINS.map(coin => (
                <div key={coin} style={s.holdingChip}>
                  <span style={s.chipSymbol}>{coin}</span>
                  <span style={s.chipAmount}>
                    {getHolding(coin).toFixed(coin === "XRP" ? 2 : 6)}
                  </span>
                  <span style={s.chipGBP}>
                    {prices[coin]
                      ? `£${(getHolding(coin) * prices[coin]!).toFixed(2)}`
                      : "—"
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live prices */}
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={s.cardTitle}>Live Prices (GBP)</span>
              <button onClick={fetchPrices} style={s.refreshBtn} disabled={priceLoading}>
                {priceLoading ? "..." : "↻ Refresh"}
              </button>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap" as const }}>
              {COINS.map(coin => (
                <div key={coin} style={s.priceChip}>
                  <span style={s.chipSymbol}>{coin}</span>
                  <span style={s.priceValue}>
                    {prices[coin] ? `£${prices[coin]!.toLocaleString()}` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trade form */}
          <div style={s.card}>

            {/* Buy / Sell toggle */}
            <div style={s.toggle}>
              <button
                onClick={() => { setTradeType("buy"); setAmountGBP(""); setAmountCoin(""); setError(null); setSuccess(null) }}
                style={{ ...s.toggleBtn, ...(tradeType === "buy" ? s.toggleBuy : {}) }}
              >
                Buy
              </button>
              <button
                onClick={() => { setTradeType("sell"); setAmountGBP(""); setAmountCoin(""); setError(null); setSuccess(null) }}
                style={{ ...s.toggleBtn, ...(tradeType === "sell" ? s.toggleSell : {}) }}
              >
                Sell
              </button>
            </div>

            {/* Coin selector */}
            <div style={{ marginBottom: "16px" }}>
              <label style={s.label}>Select Coin</label>
              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                {COINS.map(coin => (
                  <button
                    key={coin}
                    onClick={() => { setSelectedCoin(coin); setAmountGBP(""); setAmountCoin(""); setError(null); setSuccess(null) }}
                    style={{ ...s.coinBtn, ...(selectedCoin === coin ? s.coinBtnActive : {}) }}
                  >
                    {coin}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount input — switches based on buy/sell */}
            <div style={{ marginBottom: "16px" }}>
              {tradeType === "buy" ? (
                <>
                  <label style={s.label}>Amount (£)</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={amountGBP}
                    onChange={(e) => { setAmountGBP(e.target.value); setError(null); setSuccess(null) }}
                    style={s.input}
                    min="1"
                  />
                  {calculateCoinFromGBP() !== null && (
                    <div style={s.preview}>
                      <span>You will receive</span>
                      <strong>{calculateCoinFromGBP()!.toFixed(6)} {selectedCoin}</strong>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <label style={s.label}>Amount ({selectedCoin})</label>
                  <input
                    type="number"
                    placeholder={`e.g. 0.001`}
                    value={amountCoin}
                    onChange={(e) => { setAmountCoin(e.target.value); setError(null); setSuccess(null) }}
                    style={s.input}
                    min="0"
                    step="any"
                  />
                  <p style={s.hint}>
                    Available: {getHolding(selectedCoin).toFixed(6)} {selectedCoin}
                  </p>
                  {calculateGBPFromCoin() !== null && (
                    <div style={s.preview}>
                      <span>You will receive</span>
                      <strong>£{calculateGBPFromCoin()!.toFixed(2)}</strong>
                    </div>
                  )}
                </>
              )}
            </div>

            {error && <p style={s.error}>⚠ {error}</p>}
            {success && <p style={s.success}>✓ {success}</p>}

            <button
              onClick={handleTrade}
              disabled={loading || priceLoading}
              style={{
                ...s.submitBtn,
                background: tradeType === "buy" ? "#16a34a" : "#dc2626",
                opacity: loading || priceLoading ? 0.6 : 1,
              }}
            >
              {loading
                ? "Processing..."
                : tradeType === "buy"
                  ? `Buy ${selectedCoin} for £${amountGBP || "0"}`
                  : `Sell ${amountCoin || "0"} ${selectedCoin}`
              }
            </button>

          </div>
        </div>
      </section>
    </main>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  cardTitle: {
    fontWeight: "600",
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  holdingChip: {
    display: "flex",
    flexDirection: "column" as const,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "10px 14px",
    minWidth: "100px",
  },
  priceChip: {
    display: "flex",
    flexDirection: "column" as const,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "10px 14px",
    minWidth: "100px",
  },
  chipSymbol: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "600",
    marginBottom: "4px",
  },
  chipAmount: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
  },
  chipGBP: {
    fontSize: "12px",
    color: "#16a34a",
    marginTop: "2px",
  },
  priceValue: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#f59e0b",
  },
  refreshBtn: {
    background: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#64748b",
  },
  toggle: {
    display: "flex",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    marginBottom: "20px",
  },
  toggleBtn: {
    flex: 1,
    padding: "10px",
    border: "none",
    background: "#f8fafc",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "15px",
  },
  toggleBuy: {
    background: "#16a34a",
    color: "#ffffff",
  },
  toggleSell: {
    background: "#dc2626",
    color: "#ffffff",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px",
  },
  coinBtn: {
    padding: "8px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: "#f8fafc",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    color: "#374151",
  },
  coinBtnActive: {
    background: "#1e293b",
    color: "#ffffff",
    border: "1px solid #1e293b",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "16px",
    boxSizing: "border-box" as const,
    outline: "none",
    marginBottom: "8px",
  },
  preview: {
    display: "flex",
    justifyContent: "space-between",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    padding: "10px 14px",
    marginBottom: "12px",
    fontSize: "14px",
    color: "#166534",
  },
  hint: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "8px",
  },
  error: {
    color: "#dc2626",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "10px 14px",
    marginBottom: "12px",
    fontSize: "14px",
  },
  success: {
    color: "#16a34a",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    padding: "10px 14px",
    marginBottom: "12px",
    fontSize: "14px",
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
}
