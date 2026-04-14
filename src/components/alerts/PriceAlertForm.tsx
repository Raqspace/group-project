import { useState } from "react";
import type { AlertDirection, AlertSymbol } from "../../domain/entities/PriceAlert";

const SYMBOLS: AlertSymbol[] = ["BTC", "ETH", "USDT"];

type PriceAlertFormProps = {
  onCreate: (input: { symbol: AlertSymbol; direction: AlertDirection; targetPrice: number }) => Promise<void>;
  disabled?: boolean;
};

export function PriceAlertForm({ onCreate, disabled }: PriceAlertFormProps) {
  const [symbol, setSymbol] = useState<AlertSymbol>("BTC");
  const [direction, setDirection] = useState<AlertDirection>("above");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async () => {
    setFormError(null);
    const n = Number(target);
    if (!target || Number.isNaN(n) || n <= 0) {
      setFormError("Enter a valid USD target greater than 0.");
      return;
    }
    setSaving(true);
    try {
      await onCreate({ symbol, direction, targetPrice: n });
      setTarget("");
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Could not create alert");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: "0.9rem" }}>
      <h4 style={{ marginTop: 0, marginBottom: "0.65rem" }}>New alert</h4>
      <p className="live-note" style={{ marginTop: 0 }}>
        Uses the same USD prices as the rest of the app (refreshed about every 30s). You’ll get a fired state on this page when the
        market crosses your target.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginTop: 12 }}>
        <div>
          <label className="live-note" style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Asset
          </label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value as AlertSymbol)}
            disabled={disabled || saving}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cdcdc7" }}
          >
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="live-note" style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            When price goes
          </label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as AlertDirection)}
            disabled={disabled || saving}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cdcdc7" }}
          >
            <option value="above">At or above</option>
            <option value="below">At or below</option>
          </select>
        </div>
        <div style={{ flex: "1 1 140px", minWidth: 120 }}>
          <label className="live-note" style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Target (USD)
          </label>
          <input
            type="number"
            min={0}
            step="any"
            placeholder="e.g. 95000"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={disabled || saving}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #cdcdc7",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          type="button"
          className="chip"
          onClick={() => void submit()}
          disabled={disabled || saving}
          style={{
            cursor: disabled || saving ? "not-allowed" : "pointer",
            opacity: disabled || saving ? 0.65 : 1,
            background: "#2f5247",
            color: "#fff",
            border: "1px solid #87a69a",
          }}
        >
          {saving ? "Saving…" : "Add alert"}
        </button>
      </div>
      {formError ? <p className="live-error" style={{ marginTop: 12, marginBottom: 0 }}>{formError}</p> : null}
    </div>
  );
}
