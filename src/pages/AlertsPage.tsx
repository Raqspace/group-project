import { useCallback, useRef } from "react";
import { PriceAlertForm } from "../components/alerts/PriceAlertForm";
import { PriceAlertList } from "../components/alerts/PriceAlertList";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { useAutoStartPageTour } from "../hooks/useAutoStartPageTour";
import { useLivePrices } from "../hooks/useLivePrices";
import { usePriceAlerts } from "../hooks/usePriceAlerts";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { useListenTour } from "../utils/tourBus";

const fmtUsd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n >= 100 ? 0 : 2 }).format(n);

export function AlertsPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { prices, lastUpdated, error: priceError } = useLivePrices();
  const { alerts, loading, error, backend, addAlert, removeAlert, toggleActive, rearm } = usePriceAlerts(prices);

  const tour = useWalkthroughTour();
  const startTour = useCallback(() => tour.start(), [tour.start]);
  useListenTour("alerts", startTour);
  useAutoStartPageTour("alerts", startTour);

  const busy = loading;

  return (
    <div ref={rootRef} style={{ maxWidth: 720 }}>
      <div className="card" style={{ marginBottom: "0.9rem" }}>
        <h3 style={{ marginTop: 0 }}>Price alerts</h3>
        <p className="live-note" style={{ marginBottom: "0.75rem", lineHeight: 1.55 }}>
          Create USD targets for <strong>BTC</strong>, <strong>ETH</strong>, or <strong>USDT</strong> using the same live feed as the
          dashboard. When the market crosses your rule, the alert shows as <strong>Fired</strong> and pauses until you re-enable or
          delete it.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px 20px",
            padding: "10px 12px",
            background: "#ecece8",
            borderRadius: 10,
            border: "1px solid #cdcdc7",
            fontSize: "0.88rem",
          }}
        >
          <span>
            <strong>BTC</strong> {fmtUsd(prices.BTC)}
          </span>
          <span>
            <strong>ETH</strong> {fmtUsd(prices.ETH)}
          </span>
          <span>
            <strong>USDT</strong> {fmtUsd(prices.USDT)}
          </span>
          {lastUpdated ? (
            <span className="live-note" style={{ margin: 0 }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          ) : null}
        </div>
        {priceError ? <p className="live-error" style={{ marginTop: 10, marginBottom: 0 }}>{priceError}</p> : null}
      </div>

      {error ? (
        <p className="live-error" style={{ marginBottom: "0.9rem" }}>
          {error}
        </p>
      ) : null}

      <PriceAlertForm onCreate={addAlert} disabled={busy || Boolean(error)} />
      <PriceAlertList
        alerts={alerts}
        prices={prices}
        onDelete={removeAlert}
        onToggleActive={toggleActive}
        onRearm={rearm}
        disabled={busy || Boolean(error)}
      />

      {tour.step === 0 ? (
        <WalkthroughPopup
          anchorRef={rootRef}
          title="Price alerts"
          body="Pick an asset, choose above or below, and set a USD target. If the database table is missing, alerts still work using browser storage until you run supabase/price_alerts.sql."
          onClose={tour.finish}
          onNext={tour.finish}
          showNext
          nextLabel="Done"
          stepLabel="1 / 1"
        />
      ) : null}
    </div>
  );
}
