import { useEffect } from "react";
const EVENT = "cw-tour-start";
export function requestTour(page) {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { page } }));
}
/** Start this page’s tour when the user clicks Page tips in the header (any time, any refresh). */
export function useListenTour(page, onStart) {
    useEffect(() => {
        const handler = (e) => {
            const ce = e;
            if (ce.detail?.page === page)
                onStart();
        };
        window.addEventListener(EVENT, handler);
        return () => window.removeEventListener(EVENT, handler);
    }, [page, onStart]);
}
