import { useCallback, useState } from "react";

/**
 * Lightweight per-page step machine for `WalkthroughPopup`.
 *
 * - `step === null`: no overlay. User is in the product.
 * - `step >= 0`: show that step. Advancing is local to the page (no global router).
 *
 * Started by: (1) `useAutoStartPageTour` on first visit to that screen in the session, (2) header “Page tips”.
 * No remote config — keeps latency at zero.
 */
export function useWalkthroughTour() {
  const [step, setStep] = useState<number | null>(null);

  const start = useCallback(() => setStep(0), []);
  const finish = useCallback(() => setStep(null), []);
  const next = useCallback(() => setStep((s) => (s === null ? null : s + 1)), []);

  return { step, start, next, finish };
}
