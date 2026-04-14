import type { PriceAlert } from "../../domain/entities/PriceAlert";
import type { LivePricesUsd } from "../../services/prices/priceService";

const fmtUsd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n >= 100 ? 0 : 2 }).format(n);

type PriceAlertListProps = {
  alerts: PriceAlert[];
  prices: LivePricesUsd | null;
  onDelete: (id: string) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
  onRearm: (id: string) => Promise<void>;
  disabled?: boolean;
};

export function PriceAlertList({ alerts, prices, onDelete, onToggleActive, onRearm, disabled }: PriceAlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="card">
        <p className="live-note" style={{ margin: 0 }}>
          No alerts yet. Add one above — when the live price crosses your rule, it moves to <strong>Fired</strong> and pauses until you
          re-enable or delete it.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h4 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Your alerts</h4>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
        {alerts.map((a) => {
          const live = prices ? prices[a.symbol] : null;
          const fired = Boolean(a.triggeredAt);
          return (
            <li
              key={a.id}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "12px 14px",
                background: fired ? "#f0fdf4" : "#f8f8f4",
                border: `1px solid ${fired ? "#87a69a" : "#cdcdc7"}`,
                borderRadius: 10,
              }}
            >
              <div>
                <strong>{a.symbol}</strong>
                <span className="live-note" style={{ marginLeft: 8 }}>
                  {a.direction === "above" ? "≥" : "≤"} {fmtUsd(a.targetPrice)}
                </span>
                {live != null ? (
                  <span className="live-note" style={{ marginLeft: 8 }}>
                    · Now {fmtUsd(live)}
                  </span>
                ) : null}
                <div style={{ marginTop: 4, fontSize: "0.78rem", color: fired ? "#166534" : "#656663" }}>
                  {fired ? (
                    <>
                      Fired {new Date(a.triggeredAt!).toLocaleString()}
                    </>
                  ) : a.isActive ? (
                    <>Watching · {a.direction === "above" ? "fires when price reaches or passes target" : "fires at or under target"}</>
                  ) : (
                    <>Paused</>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {fired ? (
                  <button
                    type="button"
                    className="chip secondary"
                    disabled={disabled}
                    onClick={() => void onRearm(a.id)}
                    style={{ cursor: disabled ? "not-allowed" : "pointer" }}
                  >
                    Enable again
                  </button>
                ) : (
                  <button
                    type="button"
                    className="chip secondary"
                    disabled={disabled}
                    onClick={() => void onToggleActive(a.id, !a.isActive)}
                    style={{ cursor: disabled ? "not-allowed" : "pointer" }}
                  >
                    {a.isActive ? "Pause" : "Resume"}
                  </button>
                )}
                <button
                  type="button"
                  className="chip secondary"
                  disabled={disabled}
                  onClick={() => void onDelete(a.id)}
                  style={{ cursor: disabled ? "not-allowed" : "pointer", color: "#b91c1c", borderColor: "#fecaca" }}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
