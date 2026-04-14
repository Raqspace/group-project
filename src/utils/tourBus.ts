import { useEffect } from "react";

/** Screens with anchored tips + header “Page tips” replay. */
export type TourPage =
  | "dashboard"
  | "portfolio"
  | "wallet"
  | "deposit"
  | "trade"
  | "transactions"
  | "contacts"
  | "alerts"
  | "settings";

/** CustomEvent name — keeps tour triggers decoupled from React (shell vs leaf pages). */
const EVENT = "cw-tour-start";

/**
 * Manual replay from the header. Dispatched globally; the active page’s `useListenTour`
 * compares `detail.page` and starts its local `useWalkthroughTour` if it matches.
 */
export function requestTour(page: TourPage) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { page } }));
}

/**
 * Subscribe to `requestTour` for one route. Each page owns its step content; the bus only says “start now”.
 * This pattern avoids a central wizard and keeps tips contextual and instant.
 */
export function useListenTour(page: TourPage, onStart: () => void) {
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ page: TourPage }>;
      if (ce.detail?.page === page) onStart();
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [page, onStart]);
}
