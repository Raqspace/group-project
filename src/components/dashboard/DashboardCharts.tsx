type HoldingRow = { symbol: string; amount: number };
type PriceMap = Record<string, number>;

const ASSET_COLORS: Record<string, string> = {
  BTC: "#f7931a",
  ETH: "#627eea",
  XRP: "#3d3d3d",
  USDT: "#26a17b",
  DEFAULT: "#87a69a",
};

function colorFor(symbol: string) {
  return ASSET_COLORS[symbol] ?? ASSET_COLORS.DEFAULT;
}

function formatUsdCompact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

type AllocationBarProps = {
  holdings: HoldingRow[];
  prices: PriceMap;
};

export function PortfolioAllocationBar({ holdings, prices }: AllocationBarProps) {
  const rows = holdings
    .map((h) => ({
      symbol: h.symbol,
      usd: h.amount * (prices[h.symbol] ?? 0),
    }))
    .filter((r) => r.usd > 0);

  const total = rows.reduce((s, r) => s + r.usd, 0);

  if (total <= 0) {
    return (
      <p style={{ margin: 0, color: "#656663", fontSize: "0.9rem" }}>
        No holdings with prices yet. Create a wallet and open Portfolio to seed balances.
      </p>
    );
  }

  const w = 100;
  let x = 0;
  const segments = rows.map((r) => {
    const pct = (r.usd / total) * w;
    const seg = { x, width: pct, symbol: r.symbol, usd: r.usd };
    x += pct;
    return seg;
  });

  return (
    <div>
      <p style={{ margin: "0 0 8px", fontSize: "0.82rem", color: "#5f6060" }}>
        Your simulator portfolio mix (each segment = that coin’s share of your total USD value)
      </p>
      <svg width="100%" height="28" viewBox={`0 0 ${w} 28`} preserveAspectRatio="none" style={{ display: "block", borderRadius: 8 }}>
        {segments.map((s, i) => (
          <rect
            key={`${s.symbol}-${i}`}
            x={s.x}
            y="4"
            width={Math.max(s.width, 0.3)}
            height="20"
            fill={colorFor(s.symbol)}
            opacity={0.92}
          />
        ))}
      </svg>
      <ul style={{ margin: "10px 0 0", padding: 0, listStyle: "none", display: "flex", flexWrap: "wrap", gap: "12px 16px" }}>
        {rows.map((r) => (
          <li key={r.symbol} style={{ fontSize: "0.82rem", color: "#454642", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: colorFor(r.symbol), flexShrink: 0 }} />
            <strong>{r.symbol}</strong>
            <span style={{ color: "#656663" }}>
              {((r.usd / total) * 100).toFixed(1)}% · {formatUsdCompact(r.usd)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type BtcSparklineProps = {
  points: [number, number][];
  loading: boolean;
  error: string;
};

export function BtcSparkline7d({ points, loading, error }: BtcSparklineProps) {
  if (loading) {
    return <p style={{ margin: "12px 0 0", fontSize: "0.85rem", color: "#656663" }}>Loading 7 day BTC chart…</p>;
  }
  if (error) {
    return <p style={{ margin: "12px 0 0", fontSize: "0.85rem", color: "#c2410c" }}>{error}</p>;
  }
  if (points.length < 2) {
    return <p style={{ margin: "12px 0 0", fontSize: "0.85rem", color: "#656663" }}>No chart data.</p>;
  }

  const values = points.map((p) => p[1]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 6;
  const vw = 320;
  const vh = 120;
  const range = max - min || 1;

  const toX = (i: number) => pad + (i / (points.length - 1)) * (vw - pad * 2);
  const toY = (v: number) => pad + (1 - (v - min) / range) * (vh - pad * 2);

  const lineD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(2)} ${toY(p[1]).toFixed(2)}`)
    .join(" ");

  const areaD = `${lineD} L ${toX(points.length - 1).toFixed(2)} ${vh - pad} L ${pad} ${vh - pad} Z`;

  const first = points[0]![1];
  const last = points[points.length - 1]![1];
  const changePct = first > 0 ? ((last - first) / first) * 100 : 0;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "#5f6060" }}>Bitcoin market price · USD · last 7 days</p>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: changePct >= 0 ? "#15803d" : "#b91c1c" }}>
          {changePct >= 0 ? "+" : ""}
          {changePct.toFixed(2)}% over week
        </span>
      </div>
      <svg
        width="100%"
        height={vh}
        viewBox={`0 0 ${vw} ${vh}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block", marginTop: 8 }}
      >
        <defs>
          <linearGradient id="btcAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7931a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f7931a" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#btcAreaFill)" />
        <path d={lineD} fill="none" stroke="#f7931a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "#8a8a85" }}>
        This line only tracks the public BTC price. It is not your account and does not move when you send crypto in the simulator.
      </p>
    </div>
  );
}
