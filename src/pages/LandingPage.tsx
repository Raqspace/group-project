export function LandingPage() {
  return (
    <div style={{ maxWidth: 800, margin: "80px auto", padding: "32px 24px", textAlign: "center" }}>
      <div style={{ marginBottom: 24 }}>
        <span style={{ display: "inline-block", padding: "8px 16px", background: "#27272a", color: "#fff", borderRadius: 9999, fontSize: 13, letterSpacing: 1.2 }}>
          Welcome to Crypto Wallet
        </span>
      </div>
      <h1 style={{ fontSize: "2.7rem", lineHeight: 1.05, marginBottom: 16 }}>A smarter way to manage crypto funds, contacts, and alerts.</h1>
      <p style={{ fontSize: "1.05rem", color: "#6b7280", maxWidth: 620, margin: "0 auto 32px" }}>
        See your wallet balances, send to trusted contacts, track trades and transaction history, and receive price alerts — all in one secure dashboard.
        Create an account to get started, or log in if you already have one.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
        <a href="#/signup" style={{ display: "inline-block", padding: "14px 26px", background: "#2563eb", color: "white", textDecoration: "none", borderRadius: 8, fontWeight: 600 }}>
          Create Account
        </a>
        <a href="#/login" style={{ display: "inline-block", padding: "14px 26px", background: "#e5e7eb", color: "#111827", textDecoration: "none", borderRadius: 8, fontWeight: 600 }}>
          Login
        </a>
      </div>

      <div style={{ marginTop: 36, textAlign: "left", maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 12 }}>What you can do after login</h2>
        <ul style={{ listStyle: "disc", paddingLeft: 20, color: "#4b5563", lineHeight: 1.8 }}>
          <li>View live crypto prices and market updates.</li>
          <li>Access your wallet balance and transaction history.</li>
          <li>Send crypto to contacts securely.</li>
          <li>Set and receive price alerts for your favorite assets.</li>
        </ul>
      </div>
    </div>
  )
}
