import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function InfoTip({ content, label }: { content: string; label?: string }) {
  const [visible, setVisible] = useState(false);
  const [popupStyle, setPopupStyle] = useState<Record<string, string>>({});
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");
  const [arrowOffset, setArrowOffset] = useState("50%");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!visible) {
      setPopupStyle({});
      setPlacement("bottom");
      setArrowOffset("50%");
      return;
    }

    const updatePopupPosition = () => {
      const triggerElement = triggerRef.current;
      const popupElement = popupRef.current;
      if (!triggerElement || !popupElement || typeof window === "undefined") {
        return;
      }

      const spacing = 12;
      const triggerRect = triggerElement.getBoundingClientRect();
      const popupRect = popupElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const triggerCenter = triggerRect.left + triggerRect.width / 2;

      let left = triggerRect.left + triggerRect.width / 2 - popupRect.width / 2;
      let top = triggerRect.bottom + spacing;
      let nextPlacement: "top" | "bottom" = "bottom";

      if (left + popupRect.width > viewportWidth - spacing) {
        left = viewportWidth - popupRect.width - spacing;
      }

      if (left < spacing) {
        left = spacing;
      }

      if (top + popupRect.height > viewportHeight - spacing) {
        top = triggerRect.top - popupRect.height - spacing;
        nextPlacement = "top";
      }

      if (top < spacing) {
        top = spacing;
        nextPlacement = "bottom";
      }

      const arrowX = Math.min(Math.max(triggerCenter - left, 18), popupRect.width - 18);

      setPlacement(nextPlacement);
      setArrowOffset(`${arrowX}px`);
      setPopupStyle({
        left: `${left}px`,
        top: `${top}px`,
      });
    };

    updatePopupPosition();
    window.addEventListener("resize", updatePopupPosition);
    window.addEventListener("scroll", updatePopupPosition, true);

    return () => {
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition, true);
    };
  }, [visible]);

  return (
    <span
      className="info-tip"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        className="info-tip-trigger"
        aria-label={label ?? content}
      >
        ?
      </button>
      {visible && typeof document !== "undefined"
        ? createPortal(
            <span
              ref={popupRef}
              className={`info-tip-popup info-tip-popup-${placement}`}
              style={{ ...popupStyle, ["--info-tip-arrow-left" as string]: arrowOffset }}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
