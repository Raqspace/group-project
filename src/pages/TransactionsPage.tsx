import { useCallback, useRef } from "react";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { useAutoStartPageTour } from "../hooks/useAutoStartPageTour";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { useListenTour } from "../utils/tourBus";

export function TransactionsPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const tour = useWalkthroughTour();
  const startTour = useCallback(() => tour.start(), [tour.start]);
  useListenTour("transactions", startTour);
  useAutoStartPageTour("transactions", startTour);

  return (
    <div ref={rootRef} style={{ maxWidth: 640 }}>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>History</h3>
        <p className="live-note" style={{ lineHeight: 1.55 }}>
          This area is for a unified list of trades, deposits, and transfers. The table on the Dashboard is separate for now — wire both to
          the same data source when you extend the simulator.
        </p>
      </div>
      {tour.step === 0 ? (
        <WalkthroughPopup
          anchorRef={rootRef}
          title="Transaction history"
          body="Use this screen to review past activity once it’s connected to your trade and deposit records. Page tips replays this hint anytime."
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
