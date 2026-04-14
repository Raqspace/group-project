import { useEffect } from "react";
import type { TourPage } from "../utils/tourBus";

/**
 * First visit to this screen in the current browser tab session: auto-open that page’s walkthrough.
 * Replays stay available via header “Page tips”. (No per-user localStorage gate — every main screen gets its own intro.)
 */
export function useAutoStartPageTour(page: TourPage, start: () => void) {
  useEffect(() => {
    const key = `cw_session_tour_${page}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* quota / private mode */
    }
    start();
  }, [page, start]);
}
