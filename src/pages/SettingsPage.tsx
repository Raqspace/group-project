import { useCallback, useRef } from "react";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { useAutoStartPageTour } from "../hooks/useAutoStartPageTour";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { useListenTour } from "../utils/tourBus";

export function SettingsPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const tour = useWalkthroughTour();
  const startTour = useCallback(() => tour.start(), [tour.start]);
  useListenTour("settings", startTour);
  useAutoStartPageTour("settings", startTour);

  return (
    <div ref={rootRef} style={{ maxWidth: 640 }}>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Settings</h3>
        <p className="live-note" style={{ lineHeight: 1.55 }}>
          Account preferences, theme, and security options would live here. For now this page anchors the same contextual tips as the rest
          of the app.
        </p>
      </div>
      {tour.step === 0 ? (
        <WalkthroughPopup
          anchorRef={rootRef}
          title="Settings"
          body="Expand this screen with real controls as the product grows. You can always replay this blurb from Page tips in the header."
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
