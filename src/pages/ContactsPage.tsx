import { useCallback, useRef } from "react";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { useAutoStartPageTour } from "../hooks/useAutoStartPageTour";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { useListenTour } from "../utils/tourBus";

export function ContactsPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const tour = useWalkthroughTour();
  const startTour = useCallback(() => tour.start(), [tour.start]);
  useListenTour("contacts", startTour);
  useAutoStartPageTour("contacts", startTour);

  return (
    <div ref={rootRef} style={{ maxWidth: 640 }}>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Contacts</h3>
        <p className="live-note" style={{ lineHeight: 1.55 }}>
          Save addresses or labels for people you send to often. Hook this up to your send flow from Portfolio when you build it out.
        </p>
      </div>
      {tour.step === 0 ? (
        <WalkthroughPopup
          anchorRef={rootRef}
          title="Contacts"
          body="A place for recipient shortcuts — not wired to a real address book yet. Same tips pattern as the rest of the app: auto once per session, replay with Page tips."
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
