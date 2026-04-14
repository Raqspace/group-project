import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { supabase } from "../services/supabaseClient"

const stripePromise = loadStripe("pk_test_51TLu8m25bgZQ9l5jklfaIuxmQdtEBVNANJYpR1lldUtDpd5ujAQhVqhjnj3To4ZuBdcirc7HVYblqro7Wm1CVTen00aecwxCs0")

function DepositForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleDeposit = async () => {
    setError(null)
    setSuccess(null)

    if (!amount || isNaN(Number(amount)) || Number(amount) < 1) {
      setError("Enter a valid amount (minimum £1)")
      return
    }

    if (!stripe || !elements) {
      setError("Stripe not loaded yet")
      return
    }

    setLoading(true)

    try {
      // Step 1 — call our Edge Function to create a payment intent
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch(
        "https://yjhpbjfuxvcpcxnpotgi.supabase.co/functions/v1/create-payment-intent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ amount: Number(amount) }),
        }
      )

      const { clientSecret, error: fnError } = await res.json()
      if (fnError) throw new Error(fnError)

      // Step 2 — confirm the card payment with Stripe
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error("Card element not found")

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: { card: cardElement } }
      )

      if (stripeError) throw new Error(stripeError.message)

      if (paymentIntent?.status === "succeeded") {
        // Step 3 — update Wallet.balance in Supabase
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Not logged in")

        const { data: wallet } = await supabase
          .from("Wallet")
          .select("id, balance")
          .eq("user_id", user.id)
          .single()

        if (!wallet) throw new Error("Wallet not found")

        const { error: updateError } = await supabase
          .from("Wallet")
          .update({ balance: wallet.balance + Number(amount) })
          .eq("id", wallet.id)

        if (updateError) throw updateError

        setSuccess(`£${amount} deposited successfully! Your new balance will reflect shortly.`)
        setAmount("")
        cardElement.clear()
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Deposit failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "24px" }}>
      <h2>Deposit Funds</h2>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>
        Add GBP to your wallet to start trading crypto.
      </p>

      {/* Amount input */}
      <div style={{ marginBottom: "20px" }}>
        <label style={s.label}>Amount (£)</label>
        <input
          type="number"
          placeholder="e.g. 100"
          value={amount}
          min="1"
          onChange={(e) => { setAmount(e.target.value); setError(null) }}
          style={s.input}
        />
      </div>

      {/* Quick amount buttons */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {[50, 100, 250, 500].map(preset => (
          <button
            key={preset}
            onClick={() => setAmount(String(preset))}
            style={{
              ...s.presetBtn,
              ...(amount === String(preset) ? s.presetBtnActive : {})
            }}
          >
            £{preset}
          </button>
        ))}
      </div>

      {/* Stripe card input */}
      <div style={{ marginBottom: "20px" }}>
        <label style={s.label}>Card Details</label>
        <div style={s.cardBox}>
          <CardElement options={{
            hidePostalCode: true,
            style: {
              base: {
                fontSize: "16px",
                color: "#0f172a",
                "::placeholder": { color: "#94a3b8" }
              }
            }
          }} />
        </div>
        <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>
          Test card: 4242 4242 4242 4242 · Any future date · Any CVC
        </p>
      </div>

      {error && <p style={s.error}>⚠ {error}</p>}
      {success && <p style={s.success}>✓ {success}</p>}

      <button
        onClick={handleDeposit}
        disabled={loading || !stripe}
        style={{ ...s.submitBtn, opacity: loading || !stripe ? 0.6 : 1 }}
      >
        {loading ? "Processing..." : `Deposit £${amount || "0"}`}
      </button>
    </div>
  )
}

export function DepositPage() {
  return (
    <main className="app-shell">
      <section className="content">
        <Elements stripe={stripePromise}>
          <DepositForm />
        </Elements>
      </section>
    </main>
  )
}

const s: Record<string, React.CSSProperties> = {
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "16px",
    boxSizing: "border-box" as const,
  },
  presetBtn: {
    padding: "8px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: "#f8fafc",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    color: "#374151",
  },
  presetBtnActive: {
    background: "#1e293b",
    color: "#ffffff",
    border: "1px solid #1e293b",
  },
  cardBox: {
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#ffffff",
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
    background: "#1e293b",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
}
