import { useCallback, useState } from "react";
/**
 * On-demand tours only. No localStorage: users reopen tips anytime via Page tips in the header.
 */
export function useWalkthroughTour() {
    const [step, setStep] = useState(null);
    const start = useCallback(() => setStep(0), []);
    const finish = useCallback(() => setStep(null), []);
    const next = useCallback(() => setStep((s) => (s === null ? null : s + 1)), []);
    return { step, start, next, finish };
}
