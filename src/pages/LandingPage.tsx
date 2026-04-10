import { useLivePrices } from "../hooks/useLivePrices";

type SymbolRow = { sym: "BTC" | "ETH" | "USDT"; label: string };

const TICKER_ROWS: SymbolRow[] = [
  { sym: "BTC", label: "BTC" },
  { sym: "ETH", label: "ETH" },
  { sym: "USDT", label: "USDT" },
];

function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n >= 100 ? 0 : 2,
  }).format(n);
}

function fmtPct(n: number) {
  const sign = n > 0 ? "+" : n < 0 ? "" : "";
  return `${sign}${n.toFixed(1)}`;
}

export function LandingPage() {
  const { prices, changes24h, error } = useLivePrices();

  const tickerItems = TICKER_ROWS.map((r) => ({
    sym: r.label,
    price: fmtUsd(prices[r.sym]),
    ch: fmtPct(changes24h[r.sym]),
    up: changes24h[r.sym] >= 0,
  }));

  return (
    <div className="landing-root">
      <style>{`
        .landing-root {
          --landing-bg: #efefec;
          --landing-card: #f6f6f3;
          --landing-border: #cdcdc7;
          --landing-border-soft: #d0d0ca;
          --landing-text: #2e2e2d;
          --landing-muted: #656663;
          --landing-accent: #2f5247;
          --landing-accent-soft: #d6ece4;
          --landing-accent-border: #87a69a;
          --landing-pos: #15803d;
          --landing-neg: #b91c1c;
          min-height: 100vh;
          background: var(--landing-bg);
          color: var(--landing-text);
          font-family: Inter, system-ui, sans-serif;
          overflow-x: hidden;
          hyphens: none;
        }
        .landing-root * { hyphens: none; }
        .landing-grid {
          max-width: 1120px;
          margin: 0 auto;
          padding: clamp(2rem, 5vw, 4rem) clamp(1.25rem, 4vw, 2rem) 4rem;
        }
        .landing-hero {
          display: grid;
          gap: clamp(2rem, 4vw, 3rem);
          grid-template-columns: 1fr;
          align-items: center;
        }
        @media (min-width: 900px) {
          .landing-hero { grid-template-columns: 1.1fr 0.9fr; }
        }
        .landing-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 1rem;
          border-radius: 999px;
          background: var(--landing-accent-soft);
          border: 1px solid var(--landing-accent-border);
          color: var(--landing-accent);
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .landing-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--landing-accent-border);
          animation: landing-blink 2.4s ease-in-out infinite;
        }
        @keyframes landing-blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.92); }
        }
        .landing-h1 {
          margin: 1rem 0 0.75rem;
          font-size: clamp(2rem, 4.5vw, 3.15rem);
          font-weight: 700;
          line-height: 1.12;
          letter-spacing: -0.02em;
          color: var(--landing-text);
        }
        .landing-lead {
          margin: 0 0 1.75rem;
          font-size: 1.05rem;
          line-height: 1.65;
          color: var(--landing-muted);
          max-width: 34rem;
        }
        .landing-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
        }
        .landing-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.85rem 1.35rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }
        .landing-btn:active { transform: translateY(1px); }
        .landing-btn-primary {
          border: 1px solid var(--landing-accent-border);
          background: var(--landing-accent-soft);
          color: var(--landing-accent);
          box-shadow: 0 4px 14px rgba(47, 82, 71, 0.12);
        }
        .landing-btn-primary:hover {
          transform: translateY(-2px);
          background: #c5e4d8;
          box-shadow: 0 8px 20px rgba(47, 82, 71, 0.15);
        }
        .landing-btn-secondary {
          background: #f3f3ef;
          color: #454642;
          border: 1px solid #c7c6be;
        }
        .landing-btn-secondary:hover {
          background: #ebebe6;
          transform: translateY(-2px);
        }
        .landing-btn-ghost {
          background: #fff;
          color: var(--landing-muted);
          border: 1px solid var(--landing-border);
        }
        .landing-btn-ghost:hover {
          background: #fafaf8;
          border-color: #b8b8b1;
          transform: translateY(-2px);
        }
        .landing-panel {
          position: relative;
          border-radius: 20px;
          padding: 1.35rem;
          background: var(--landing-card);
          border: 1px solid var(--landing-border);
          box-shadow: 0 12px 36px rgba(46, 46, 45, 0.06);
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .landing-panel:hover {
          border-color: #b8b9b2;
          box-shadow: 0 16px 44px rgba(46, 46, 45, 0.08);
        }
        .landing-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.1rem;
        }
        .landing-panel-title { font-size: 0.75rem; color: var(--landing-muted); text-transform: uppercase; letter-spacing: 0.08em; }
        .landing-panel-hint {
          margin: 0.35rem 0 0;
          font-size: 0.78rem;
          color: #8a8a85;
          font-weight: 500;
        }
        .landing-balance {
          font-size: 1.85rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums;
          color: var(--landing-text);
        }
        .landing-balance span { color: var(--landing-pos); font-size: 1rem; font-weight: 600; margin-left: 0.35rem; }
        .landing-chart {
          height: 96px;
          display: flex;
          align-items: flex-end;
          gap: 4px;
          margin-top: 0.5rem;
        }
        .landing-chart-bar {
          flex: 1;
          border-radius: 4px 4px 2px 2px;
          background: linear-gradient(180deg, #b9c4b6, #e2e8e0);
          min-height: 18%;
          transition: transform 0.35s ease, opacity 0.35s ease;
        }
        .landing-panel:hover .landing-chart-bar {
          opacity: 0.95;
        }
        .landing-ticker-wrap {
          margin-top: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid var(--landing-border-soft);
        }
        .landing-ticker-caption {
          margin: 0 0 0.65rem;
          font-size: 0.78rem;
          color: var(--landing-muted);
        }
        .landing-ticker-error {
          margin: 0 0 0.5rem;
          font-size: 0.78rem;
          color: #c2410c;
          font-weight: 600;
        }
        .landing-ticker {
          display: flex;
          gap: 0.65rem;
          overflow: hidden;
        }
        .landing-ticker-track {
          display: flex;
          gap: 0.65rem;
          animation: landing-scroll 22s linear infinite;
        }
        @keyframes landing-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .landing-ticker-item {
          flex-shrink: 0;
          padding: 0.5rem 0.85rem;
          border-radius: 10px;
          background: #f8f8f4;
          border: 1px solid var(--landing-border-soft);
          font-size: 0.8rem;
          font-variant-numeric: tabular-nums;
          color: var(--landing-text);
        }
        .landing-ticker-item strong { color: #1f3c34; margin-right: 0.5rem; }
        .landing-ticker-item .up { color: var(--landing-pos); }
        .landing-ticker-item .down { color: var(--landing-neg); }
        .landing-features {
          margin-top: clamp(2.5rem, 5vw, 4rem);
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
        .landing-feature {
          padding: 1.25rem 1.35rem;
          border-radius: 16px;
          background: var(--landing-card);
          border: 1px solid var(--landing-border);
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .landing-feature:hover {
          background: #fafaf7;
          border-color: var(--landing-accent-border);
        }
        .landing-feature h3 {
          margin: 0 0 0.5rem;
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--landing-text);
        }
        .landing-feature p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.55;
          color: var(--landing-muted);
        }
        .landing-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          margin-bottom: 0.85rem;
          background: var(--landing-accent-soft);
          color: var(--landing-accent);
          border: 1px solid var(--landing-accent-border);
          font-size: 1.1rem;
        }
      `}</style>

      <div className="landing-grid">
        <div className="landing-hero">
          <div>
            <div className="landing-badge">
              <span className="landing-badge-dot" aria-hidden />
              CryptoWallet
            </div>
            <h1 className="landing-h1">Learn cryptocurrency wallet workflows in a simulated environment.</h1>
            <p className="landing-lead">
              CryptoWallet is an instructional simulator, not a live trading venue. Review balances, complete simulated transfer exercises, explore trade concepts, and configure price notifications without committing capital. Sign in to continue with your account, or visit the demo page to access a demonstrator workspace without registration.
            </p>
            <div className="landing-actions">
              <a className="landing-btn landing-btn-primary" href="#/signup">
                Create account
              </a>
              <a className="landing-btn landing-btn-secondary" href="#/login">
                Log in
              </a>
              <a className="landing-btn landing-btn-ghost" href="#/demo">
                Demo / Demonstrator
              </a>
            </div>
          </div>

          <div className="landing-panel">
            <div className="landing-panel-header">
              <div>
                <div className="landing-panel-title">Sample portfolio</div>
                <p className="landing-panel-hint">Illustrative totals for training purposes</p>
                <div className="landing-balance">
                  $128,420
                  <span>+3.1%</span>
                </div>
              </div>
            </div>
            <div className="landing-chart" aria-hidden>
              {[35, 52, 48, 61, 55, 72, 68, 80, 76, 88, 84, 92].map((h, i) => (
                <div key={i} className="landing-chart-bar" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="landing-ticker-wrap">
              <p className="landing-ticker-caption">
                Market reference prices in USD, updated on the same cadence as the application, approximately every 30 seconds.
              </p>
              {error ? <p className="landing-ticker-error">{error}</p> : null}
              <div className="landing-ticker" aria-label="Live crypto prices">
                <div className="landing-ticker-track">
                  {[...tickerItems, ...tickerItems].map((row, i) => (
                    <div key={i} className="landing-ticker-item">
                      <strong>{row.sym}</strong>
                      {row.price}
                      <span className={row.up ? "up" : "down"}> {row.ch}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-features">
          <div className="landing-feature">
            <div className="landing-icon">◈</div>
            <h3>Word explanations</h3>
            <p>Plain language on what labels, balances, and actions mean so you are not guessing as you move through the simulator.</p>
          </div>
          <div className="landing-feature">
            <div className="landing-icon">◇</div>
            <h3>Walkthroughs</h3>
            <p>Step by step paths that show where things live and in what order you would typically use them in a real wallet.</p>
          </div>
          <div className="landing-feature">
            <div className="landing-icon">◎</div>
            <h3>Practice flows</h3>
            <p>Try simulated buy and sell, and send funds to contacts, with no real capital required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
