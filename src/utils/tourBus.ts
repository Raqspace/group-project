import { useEffect } from "react";

export type TourPage = "dashboard" | "portfolio" | "wallet";

const EVENT = "cw-tour-start";

export function requestTour(page: TourPage) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { page } }));
}

/** Start this page’s tour when the user clicks Page tips in the header (any time, any refresh). */
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
