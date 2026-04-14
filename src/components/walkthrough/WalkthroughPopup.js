import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLayoutEffect, useRef, useState } from "react";
import "./walkthrough.css";
export function WalkthroughPopup({ anchorRef, title, body, onClose, onNext, showNext, stepLabel, nextLabel = "Next", showReplayHint = true, }) {
    const popupRef = useRef(null);
    const [style, setStyle] = useState({ visibility: "hidden" });
    const [tail, setTail] = useState("bottom");
    useLayoutEffect(() => {
        const el = anchorRef.current;
        const pop = popupRef.current;
        if (!el)
            return;
        const place = () => {
            const r = el.getBoundingClientRect();
            const h = pop?.offsetHeight ?? 150;
            const gap = 14;
            const centerX = r.left + r.width / 2;
            let top = r.top + window.scrollY - h - gap;
            let nextTail = "bottom";
            if (top < window.scrollY + 6) {
                top = r.bottom + window.scrollY + gap;
                nextTail = "top";
            }
            setTail(nextTail);
            setStyle({
                visibility: "visible",
                left: Math.min(Math.max(centerX, 168), window.innerWidth - 168),
                top,
                transform: "translate(-50%, 0)",
            });
        };
        place();
        const t = window.requestAnimationFrame(place);
        window.addEventListener("scroll", place, true);
        window.addEventListener("resize", place);
        return () => {
            window.cancelAnimationFrame(t);
            window.removeEventListener("scroll", place, true);
            window.removeEventListener("resize", place);
        };
    }, [anchorRef, title, body]);
    const tailClass = tail === "bottom" ? "walkthrough-tail-bottom" : "walkthrough-tail-top";
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "walkthrough-dim", "aria-hidden": true }), _jsxs("div", { ref: popupRef, className: `walkthrough-popup-root ${tailClass}`, style: style, role: "dialog", "aria-labelledby": "walkthrough-popup-title", children: [_jsx("button", { type: "button", className: "walkthrough-popup-close", onClick: onClose, "aria-label": "Close", children: "\u00D7" }), stepLabel ? (_jsx("p", { style: {
                            margin: "0 0 4px",
                            fontSize: "0.7rem",
                            color: "#9ca3af",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                        }, children: stepLabel })) : null, _jsx("h4", { id: "walkthrough-popup-title", className: "walkthrough-popup-title", children: title }), _jsx("p", { className: "walkthrough-popup-body", children: body }), showReplayHint ? (_jsx("p", { className: "walkthrough-popup-hint", children: "Confused later? Click Page tips in the bar above." })) : null, _jsxs("div", { className: "walkthrough-popup-footer", children: [_jsx("button", { type: "button", className: "walkthrough-popup-skip", onClick: onClose, children: "Close" }), showNext && onNext ? (_jsx("button", { type: "button", className: "walkthrough-popup-next", onClick: onNext, children: nextLabel })) : null] })] })] }));
}
