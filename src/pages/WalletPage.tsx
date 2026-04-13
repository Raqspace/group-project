// WalletPage() - placeholder for wallet.
import { useState, useEffect } from "react"
import { supabase } from "../services/supabaseClient"

export function WalletPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [wallet, setWallet] = useState(null)
  const [recipientAddress, setRecipientAddress] = useState("")
  const [sendAmount, setSendAmount] = useState("")
  const [sendError, setSendError] = useState("")
  const [sendSuccess, setSendSuccess] = useState("")

  useEffect(() => {
    loadWallet()
  }, [])

  const generateWalletAddress = () => {
    const chars = "0123456789abcdef"
    let address = "0x"
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)]
    }
    return address
  }

  const loadWallet = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: walletData } = await supabase
      .from("Wallet")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (walletData) setWallet(walletData)
  }

  const handleCreateWallet = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in to create a wallet")
      setLoading(false)
      return
    }

    const { data: existing } = await supabase
      .from("Wallet")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (existing) {
      setError("You already have a wallet")
      setLoading(false)
      return
    }

    const { error: walletError } = await supabase
      .from("Wallet")
      .insert({
        user_id: user.id,
        public_address: generateWalletAddress(),
        balance: 0
      })

    if (walletError) {
      setError("Failed to create wallet. Please try again.")
      setLoading(false)
      return
    }

    const { data: newWallet } = await supabase
      .from("Wallet")
      .select("id")
      .eq("user_id", user.id)
      .single()

    await supabase.from("holdings").insert([
      { wallet_id: newWallet.id, symbol: "BTC", amount: 0.001 },
      { wallet_id: newWallet.id, symbol: "ETH", amount: 1.5 },
      { wallet_id: newWallet.id, symbol: "XRP", amount: 100 }
    ])

    setLoading(false)
    setSuccess("✅ Wallet created successfully! Redirecting to your portfolio...")
    setTimeout(() => {
      window.location.hash = "#/portfolio"
    }, 2000)
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
    if (amount > wallet.balance) {
      setSendError("Insufficient balance")
      return
    }
    if (recipientAddress === wallet.public_address) {
      setSendError("Cannot send to your own address")
      return
    }

    setLoading(true)

    const { error: senderError } = await supabase
      .from("Wallet")
      .update({ balance: wallet.balance - amount })
      .eq("id", wallet.id)

    if (senderError) {
      setSendError("Transaction failed")
      setLoading(false)
      return
    }

    const { data: recipientWallet } = await supabase
      .from("Wallet")
      .select("*")
      .eq("public_address", recipientAddress)
      .single()

    if (recipientWallet) {
      await supabase
        .from("Wallet")
        .update({ balance: recipientWallet.balance + amount })
        .eq("id", recipientWallet.id)
    }

    setSendSuccess(`Successfully sent ${amount} ETH to ${recipientAddress}`)
    setRecipientAddress("")
    setSendAmount("")
    loadWallet()
    setLoading(false)
  }

  if (!wallet) {
    return (
      <div style={{ maxWidth: "600px", margin: "60px auto", padding: "20px" }}>
        <h2>Welcome to Your Crypto Wallet</h2>
        <p>You don't have a wallet yet. Create one to get started.</p>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green", marginTop: "10px" }}>{success}</p>}
        <button
          onClick={handleCreateWallet}
          disabled={loading}
          style={{ marginTop: "20px", padding: "12px 24px", fontSize: "16px" }}>
          {loading ? "Creating your wallet..." : "Create My Wallet"}
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", padding: "20px" }}>
      <div style={{ background: "#f5f5f5", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
        <h2>My Wallet</h2>
        <p><strong>Address:</strong> {wallet.public_address}</p>
        <p><strong>Balance:</strong> {wallet.balance} ETH</p>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h3>Send Crypto</h3>
        {sendError && <p style={{ color: "red" }}>{sendError}</p>}
        {sendSuccess && <p style={{ color: "green" }}>{sendSuccess}</p>}
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
          style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <button onClick={handleSend} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h3>Receive Crypto</h3>
        <p>Share your address to receive crypto:</p>
        <div style={{ background: "#eee", padding: "10px", borderRadius: "4px", wordBreak: "break-all" }}>
          {wallet.public_address}
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(wallet.public_address)}
          style={{ marginTop: "10px" }}>
          Copy Address
        </button>
      </div>
    </div>
  )
}