import { useState, useEffect } from "react"
import { supabase } from "../services/supabaseClient"

type Holding = {
  id: string
  symbol: string
  amount: number
}

type Prices = {
  BTC: number
  ETH: number
  XRP: number
  [key: string]: number
}

export function PortfolioPage() {
  const [wallet, setWallet] = useState<any>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [prices, setPrices] = useState<Prices>({ BTC: 0, ETH: 0, XRP: 0 })
  const [loading, setLoading] = useState(true)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<"send" | "receive">("send")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [sendAmount, setSendAmount] = useState("")
  const [sendSymbol, setSendSymbol] = useState("ETH")
  const [sendError, setSendError] = useState("")
  const [sendSuccess, setSendSuccess] = useState("")
  const [sendLoading, setSendLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadWallet(), loadPrices()])
    setLoading(false)
  }

  const loadWallet = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: walletData } = await supabase
      .from("Wallet")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (walletData) {
      setWallet(walletData)
      loadHoldings(walletData.id)
    }
  }

  const loadHoldings = async (walletId: string) => {
    const { data } = await supabase
      .from("holdings")
      .select("*")
      .eq("wallet_id", walletId)

    if (data) setHoldings(data)
  }

  const loadPrices = async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple&vs_currencies=usd"
      )
      const data = await res.json()
      setPrices({
        BTC: data.bitcoin.usd,
        ETH: data.ethereum.usd,
        XRP: data.ripple.usd
      })
    } catch {
      // fallback prices if API fails
      setPrices({ BTC: 60000, ETH: 3000, XRP: 0.5 })
    }
  }

  const getTotalBalance = () => {
    return holdings.reduce((total, h) => {
      return total + h.amount * (prices[h.symbol] || 0)
    }, 0)
  }

  const openModal = (type: "send" | "receive") => {
    setModalType(type)
    setSendError("")
    setSendSuccess("")
    setRecipientAddress("")
    setSendAmount("")
    setShowModal(true)
  }

  const handleSend = async () => {
    setSendError("")
    setSendSuccess("")

    const amount = parseFloat(sendAmount)

    if (!recipientAddress) {
      setSendError("Please enter a recipient address")
      return
    }
    if (!amount || amount <= 0) {
      setSendError("Please enter a valid amount")
      return
    }

    // Find the holding for selected symbol
    const holding = holdings.find(h => h.symbol === sendSymbol)
    if (!holding || holding.amount < amount) {
      setSendError("Insufficient balance")
      return
    }
    if (recipientAddress === wallet.public_address) {
      setSendError("Cannot send to your own address")
      return
    }

    setSendLoading(true)

    // Deduct from sender holding
    const { error: deductError } = await supabase
      .from("holdings")
      .update({ amount: holding.amount - amount })
      .eq("id", holding.id)

    if (deductError) {
      setSendError("Transaction failed")
      setSendLoading(false)
      return
    }

    // Find recipient wallet
    const { data: recipientWallet } = await supabase
      .from("Wallet")
      .select("id")
      .eq("public_address", recipientAddress)
      .single()

    // Add to recipient holding if they exist
    if (recipientWallet) {
      const { data: recipientHolding } = await supabase
        .from("holdings")
        .select("*")
        .eq("wallet_id", recipientWallet.id)
        .eq("symbol", sendSymbol)
        .single()

      if (recipientHolding) {
        await supabase
          .from("holdings")
          .update({ amount: recipientHolding.amount + amount })
          .eq("id", recipientHolding.id)
      }
    }

    setSendSuccess(`Successfully sent ${amount} ${sendSymbol}`)
    setRecipientAddress("")
    setSendAmount("")
    loadWallet()
    setSendLoading(false)
  }

  if (loading) {
    return <p style={{ padding: "40px" }}>Loading portfolio...</p>
  }

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", padding: "20px" }}>

      {/* Total Balance */}
      <div style={{ background: "#1B3A5C", color: "white", padding: "24px", borderRadius: "8px", marginBottom: "30px" }}>
        <p style={{ margin: 0, opacity: 0.7 }}>Total Portfolio Value</p>
        <h2 style={{ margin: "8px 0 0" }}>${getTotalBalance().toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        <p style={{ margin: "8px 0 0", fontSize: "13px", opacity: 0.6 }}>
          Wallet: {wallet?.public_address?.slice(0, 20)}...
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "30px" }}>
        <button
          onClick={() => openModal("send")}
          style={{ padding: "10px 24px", background: "#1B3A5C", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "15px" }}>
          Send
        </button>
        <button
          onClick={() => openModal("receive")}
          style={{ padding: "10px 24px", background: "#2E7D32", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "15px" }}>
          Receive
        </button>
      </div>

      {/* Holdings */}
      <h3>My Holdings</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {holdings.map((h) => (
          <div key={h.id} style={{ background: "#f5f5f5", padding: "16px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: "18px" }}>{h.symbol}</strong>
              <p style={{ margin: "4px 0 0", color: "#666", fontSize: "14px" }}>
                {h.amount} {h.symbol}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <strong>${(h.amount * (prices[h.symbol] || 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              <p style={{ margin: "4px 0 0", color: "#666", fontSize: "13px" }}>
                @ ${prices[h.symbol]?.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "12px", width: "400px", position: "relative" }}>

            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              style={{ position: "absolute", top: "12px", right: "16px", background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>
              ✕
            </button>

            {modalType === "send" ? (
              <>
                <h3>Send Crypto</h3>
                {sendError && <p style={{ color: "red" }}>{sendError}</p>}
                {sendSuccess && <p style={{ color: "green" }}>{sendSuccess}</p>}

                <select
                  value={sendSymbol}
                  onChange={(e) => setSendSymbol(e.target.value)}
                  style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px" }}>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="XRP">XRP</option>
                </select>

                <input
                  type="text"
                  placeholder="Recipient address (0x...)"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px" }}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  style={{ display: "block", width: "100%", padding: "8px", marginBottom: "16px" }}
                />
                <button
                  onClick={handleSend}
                  disabled={sendLoading}
                  style={{ width: "100%", padding: "10px", background: "#1B3A5C", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                  {sendLoading ? "Sending..." : "Confirm Send"}
                </button>
              </>
            ) : (
              <>
                <h3>Receive Crypto</h3>
                <p>Share your wallet address to receive crypto:</p>
                <div style={{ background: "#eee", padding: "12px", borderRadius: "6px", wordBreak: "break-all", fontSize: "13px" }}>
                  {wallet?.public_address}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(wallet?.public_address)}
                  style={{ marginTop: "12px", width: "100%", padding: "10px", background: "#2E7D32", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                  Copy Address
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}