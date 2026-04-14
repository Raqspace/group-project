/**
 * Small anchored callout used for contextual tips (not a full-screen wizard).
 * Position is derived from `anchorRef` so guidance stays tied to real UI as the user explores the app.
 */
import { useLayoutEffect, useRef, useState } from "react";
import "./walkthrough.css";

type WalkthroughPopupProps = {
  anchorRef: React.RefObject<HTMLElement | null>;
  title: string;
  body: string;
  onClose: () => void;
  onNext?: () => void;
  showNext?: boolean;
  stepLabel?: string;
  nextLabel?: string;
  /** Short line about reopening tips (default on). */
  showReplayHint?: boolean;
};

export function WalkthroughPopup({
  anchorRef,
  title,
  body,
  onClose,
  onNext,
  showNext,
  stepLabel,
  nextLabel = "Next",
  showReplayHint = true,
}: WalkthroughPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden" });
  const [tail, setTail] = useState<"top" | "bottom">("bottom");

  useLayoutEffect(() => {
    const el = anchorRef.current;
    const pop = popupRef.current;
    if (!el) return;

    const place = () => {
      const r = el.getBoundingClientRect();
      const h = pop?.offsetHeight ?? 150;
      const gap = 14;
      const centerX = r.left + r.width / 2;
      let top = r.top + window.scrollY - h - gap;
      let nextTail: "top" | "bottom" = "bottom";
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

  return (
    <>
      <div className="walkthrough-dim" aria-hidden />
      <div
        ref={popupRef}
        className={`walkthrough-popup-root ${tailClass}`}
        style={style}
        role="dialog"
        aria-labelledby="walkthrough-popup-title"
      >
        <button
          type="button"
          className="walkthrough-popup-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        {stepLabel ? (
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "0.7rem",
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {stepLabel}
          </p>
        ) : null}
        <h4 id="walkthrough-popup-title" className="walkthrough-popup-title">
          {title}
        </h4>
        <p className="walkthrough-popup-body">{body}</p>
        {showReplayHint ? (
          <p className="walkthrough-popup-hint">Confused later? Click Page tips in the bar above.</p>
        ) : null}
        <div className="walkthrough-popup-footer">
          <button type="button" className="walkthrough-popup-skip" onClick={onClose}>
            Close
          </button>
          {showNext && onNext ? (
            <button type="button" className="walkthrough-popup-next" onClick={onNext}>
              {nextLabel}
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
