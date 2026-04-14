import { useCallback, useRef } from "react";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { useAutoStartPageTour } from "../hooks/useAutoStartPageTour";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { useListenTour } from "../utils/tourBus";

export function AlertsPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const tour = useWalkthroughTour();
  const startTour = useCallback(() => tour.start(), [tour.start]);
  useListenTour("alerts", startTour);
  useAutoStartPageTour("alerts", startTour);

  return (
    <div ref={rootRef} style={{ maxWidth: 640 }}>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Price alerts</h3>
        <p className="live-note" style={{ lineHeight: 1.55 }}>
          Set targets like “notify me if BTC crosses $X”. Connect this UI to your alert service or local notifications when you’re ready.
        </p>
      </div>
      {tour.step === 0 ? (
        <WalkthroughPopup
          anchorRef={rootRef}
          title="Alerts"
          body="Optional price watches for learning flows. Tips here work like everywhere else: first open in a session, then use Page tips if you need a reminder."
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
