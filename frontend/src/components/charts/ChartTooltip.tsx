import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { createPortal } from "react-dom";

type ChartTooltipProps = {
  content: string | null;
  x?: number;
  y?: number;
};

export function ChartTooltip({ content, x, y }: ChartTooltipProps) {
  const popupRef = useRef<HTMLSpanElement | null>(null);
  const [style, setStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (x == null || y == null || !popupRef.current) return;
    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const spacing = 12;

    let left = x + spacing;
    let top = y - rect.height / 2;

    if (left + rect.width > vw - spacing) left = x - rect.width - spacing;
    if (left < spacing) left = spacing;
    if (top + rect.height > vh - spacing) top = vh - rect.height - spacing;
    if (top < spacing) top = spacing;

    setStyle({ left: `${left}px`, top: `${top}px` });
  }, [x, y, content]);

  if (!content || typeof document === "undefined") return null;

  return createPortal(
    <span
      ref={popupRef}
      data-testid="chart-tooltip"
      className="chart-tooltip-popup"
      style={style}
    >
      {content}
    </span>,
    document.body,
  );
}

/** Hook to track mouse position within an SVG for tooltip placement. */
export function useChartTooltip() {
  const [tip, setTip] = useState<{ content: string; x: number; y: number } | null>(null);

  function show(content: string, event: MouseEvent) {
    setTip({ content, x: event.clientX, y: event.clientY });
  }

  function move(event: MouseEvent) {
    setTip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : null));
  }

  function hide() {
    setTip(null);
  }

  return { tip, show, move, hide } as const;
}
