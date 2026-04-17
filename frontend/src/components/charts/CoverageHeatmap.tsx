import * as d3 from "d3";
import { useCallback, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";

import { InfoTip } from "../InfoTip";
import type { BaseChartProps, HeatmapSetorTipoChart } from "./types";
import { ChartTooltip, useChartTooltip } from "./ChartTooltip";

type Props = BaseChartProps & {
  title: string;
  data: HeatmapSetorTipoChart;
  onPeriodChange?: (months: number) => void;
};

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

const CHART_RATIONALE: Record<string, string> = {
  "pt-BR": [
    "Este heatmap cruza setores da planta com tipos de auditoria, revelando lacunas de cobertura (gaps) e concentrações.",
    "Fonte: view auditorias_planejadas (MySQL), agregado por Sector_Description × AuditingPlanningDepartmentCodeDescription.",
    "Escala de cores: Cividis (colorblind-safe). Intensidade = volume de auditorias no período selecionado.",
    "Células vermelhas tracejadas (gap) indicam combinações setor × tipo sem nenhuma auditoria — potencial não-conformidade com IATF 16949 §9.2.",
    "Use os filtros de setor e tipo para focar em áreas específicas. Ctrl+scroll ou botões +/- para zoom.",
  ].join(" "),
  "en-US": [
    "This heatmap crosses plant sectors with audit types, revealing coverage gaps and concentrations.",
    "Source: auditorias_planejadas view (MySQL), aggregated by Sector_Description × AuditingPlanningDepartmentCodeDescription.",
    "Color scale: Cividis (colorblind-safe). Intensity = audit volume in selected period.",
    "Red dashed cells (gap) indicate sector × type combinations with no audits — potential IATF 16949 §9.2 non-conformance.",
    "Use sector and type filters to focus on specific areas. Ctrl+scroll or +/- buttons to zoom.",
  ].join(" "),
};

export function CoverageHeatmap({ title, data, labels, locale, onDrillDown, onPeriodChange }: Props) {
  const { tip, show, move, hide } = useChartTooltip();
  const [period, setPeriod] = useState<"12m" | "3y">(data.period_months <= 12 ? "12m" : "3y");
  const [initialized, setInitialized] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [sectorDropdownOpen, setSectorDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { cells, insight_lead } = data;
  const lang = locale === "en-US" ? "en-US" : "pt-BR";

  const allSectors = useMemo(() => [...new Set(cells.map((c) => c.sector))].sort(), [cells]);
  const allAuditTypes = useMemo(() => [...new Set(cells.map((c) => c.audit_type))].sort(), [cells]);

  const sectors = useMemo(
    () => {
      if (!initialized) return [];
      return selectedSectors.size > 0 ? allSectors.filter((s) => selectedSectors.has(s)) : allSectors;
    },
    [allSectors, selectedSectors, initialized],
  );
  const auditTypes = useMemo(
    () => {
      if (!initialized) return [];
      return selectedTypes.size > 0 ? allAuditTypes.filter((t) => selectedTypes.has(t)) : allAuditTypes;
    },
    [allAuditTypes, selectedTypes, initialized],
  );

  const cellLookup = useMemo(() => {
    const map = new Map<string, typeof cells[number]>();
    for (const cell of cells) {
      map.set(`${cell.sector}|||${cell.audit_type}`, cell);
    }
    return map;
  }, [cells]);

  const hasFilters = selectedSectors.size > 0 || selectedTypes.size > 0;

  function toggleSector(s: string) {
    setInitialized(true);
    setSelectedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function toggleType(t: string) {
    setInitialized(true);
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function selectAllSectors() {
    setInitialized(true);
    setSelectedSectors(new Set());
    setSelectedTypes(new Set());
  }

  function clearFilters() {
    setInitialized(false);
    setSelectedSectors(new Set());
    setSelectedTypes(new Set());
  }

  function zoomIn() { setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP)); }
  function zoomOut() { setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP)); }
  function zoomReset() { setZoom(1); setPan({ x: 0, y: 0 }); }

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setZoom((z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z + delta)));
      } else if (zoom > 1) {
        e.preventDefault();
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    },
    [zoom],
  );

  function handlePointerDown(e: PointerEvent) {
    if (zoom <= 1) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function handlePointerMove(e: PointerEvent) {
    if (!isPanning.current) return;
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    });
  }
  function handlePointerUp() { isPanning.current = false; }

  if (cells.length === 0) {
    return (
      <section className="exec-chart-card" data-testid="chart-heatmap">
        <h4 className="exec-chart-title" data-testid="chart-title">
          {title}
          <InfoTip content={CHART_RATIONALE[lang]} label={title} />
        </h4>
        <p className="exec-chart-insight" data-testid="insight-lead">{labels.chartInsightDefault}</p>
        <p className="exec-chart-empty">{labels.chartEmptyState}</p>
        <p className="exec-chart-empty-hint">{labels.chartEmptyHint}</p>
      </section>
    );
  }

  const insightText = insight_lead.text || labels.chartInsightDefault;

  const filteredCells = cells.filter(
    (c) =>
      (selectedSectors.size === 0 || selectedSectors.has(c.sector)) &&
      (selectedTypes.size === 0 || selectedTypes.has(c.audit_type)),
  );
  const maxCount = Math.max(1, ...filteredCells.map((c) => c.count));
  const colorScale = d3.scaleSequential(d3.interpolateCividis).domain([0, maxCount]);
  const textFillFor = (value: number) =>
    d3.lab(colorScale(value)).l > 60 ? "#1e293b" : "rgba(243, 239, 231, 0.78)";

  const cellSize = 40;
  const marginLeft = 130;
  const marginTop = 120;
  const svgWidth = marginLeft + auditTypes.length * cellSize + 10;
  const svgHeight = marginTop + sectors.length * cellSize + 10;

  function handlePeriodToggle(p: "12m" | "3y") {
    setPeriod(p);
    onPeriodChange?.(p === "12m" ? 12 : 36);
  }

  const scaleStops = 5;
  const scaleValues = Array.from({ length: scaleStops + 1 }, (_, i) => Math.round((maxCount / scaleStops) * i));

  const sectorLabel = selectedSectors.size > 0
    ? `${labels.heatmapFilterSector} (${selectedSectors.size})`
    : `${labels.heatmapFilterSector}: ${labels.heatmapFilterAll}`;
  const typeLabel = selectedTypes.size > 0
    ? `${labels.heatmapFilterType} (${selectedTypes.size})`
    : `${labels.heatmapFilterType}: ${labels.heatmapFilterAll}`;

  return (
    <section className="exec-chart-card" data-testid="chart-heatmap">
      <h4 className="exec-chart-title" data-testid="chart-title">
        {title}
        <InfoTip content={CHART_RATIONALE[lang]} label={title} />
      </h4>
      <p className="exec-chart-insight" data-testid="insight-lead">{insightText}</p>

      {/* Row 1: period toggles + zoom */}
      <div className="heatmap-toolbar">
        <div className="heatmap-toolbar-left">
          <div className="heatmap-toggles" role="group">
            <button type="button" data-testid="heatmap-toggle-12m"
              aria-pressed={period === "12m"}
              className={`toggle-button ${period === "12m" ? "toggle-active" : ""}`}
              onClick={() => handlePeriodToggle("12m")}
            >{labels.heatmapToggle12m}</button>
            <button type="button" data-testid="heatmap-toggle-3y"
              aria-pressed={period === "3y"}
              className={`toggle-button ${period === "3y" ? "toggle-active" : ""}`}
              onClick={() => handlePeriodToggle("3y")}
            >{labels.heatmapToggle3y}</button>
          </div>
        </div>

        <div className="heatmap-zoom-controls" role="group" aria-label="Zoom">
          <button type="button" className="zoom-btn" data-testid="heatmap-zoom-out" onClick={zoomOut}
            disabled={zoom <= ZOOM_MIN} title={labels.heatmapZoomOut}>−</button>
          <span className="zoom-level" data-testid="heatmap-zoom-level">{Math.round(zoom * 100)}%</span>
          <button type="button" className="zoom-btn" data-testid="heatmap-zoom-in" onClick={zoomIn}
            disabled={zoom >= ZOOM_MAX} title={labels.heatmapZoomIn}>+</button>
          <button type="button" className="zoom-btn zoom-btn-text" data-testid="heatmap-zoom-reset" onClick={zoomReset}
            disabled={zoom === 1 && pan.x === 0 && pan.y === 0} title={labels.heatmapZoomReset}>⟲</button>
        </div>
      </div>

      {/* Row 2: filters (sector + type + clear) */}
      <div className="heatmap-filters-row">
        <div className="heatmap-dropdown heatmap-dropdown-end" data-testid="heatmap-filter-sector-dropdown">
          <button type="button"
            className={`heatmap-dropdown-trigger ${selectedSectors.size > 0 ? "heatmap-dropdown-active" : ""}`}
            onClick={() => { setSectorDropdownOpen((v) => !v); setTypeDropdownOpen(false); }}
          >
            {sectorLabel} <span className="heatmap-dropdown-arrow">{sectorDropdownOpen ? "▲" : "▼"}</span>
          </button>
          {sectorDropdownOpen ? (
            <div className="heatmap-dropdown-menu" data-testid="heatmap-sector-menu">
              {allSectors.map((s) => (
                <label key={s} className="heatmap-dropdown-option">
                  <input type="checkbox" checked={selectedSectors.has(s)}
                    onChange={() => toggleSector(s)} />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>

        <div className="heatmap-dropdown" data-testid="heatmap-filter-type-dropdown">
          <button type="button"
            className={`heatmap-dropdown-trigger ${selectedTypes.size > 0 ? "heatmap-dropdown-active" : ""}`}
            onClick={() => { setTypeDropdownOpen((v) => !v); setSectorDropdownOpen(false); }}
          >
            {typeLabel} <span className="heatmap-dropdown-arrow">{typeDropdownOpen ? "▲" : "▼"}</span>
          </button>
          {typeDropdownOpen ? (
            <div className="heatmap-dropdown-menu" data-testid="heatmap-type-menu">
              {allAuditTypes.map((t) => (
                <label key={t} className="heatmap-dropdown-option">
                  <input type="checkbox" checked={selectedTypes.has(t)}
                    onChange={() => toggleType(t)} />
                  <span>{t}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>

        {hasFilters ? (
          <button type="button" className="heatmap-clear-btn" data-testid="heatmap-filter-clear"
            onClick={clearFilters}>{labels.heatmapFilterClear}</button>
        ) : null}
      </div>

      {/* Prompt to select filters or show all */}
      {!initialized ? (
        <div className="heatmap-prompt" data-testid="heatmap-select-prompt">
          <p>{labels.heatmapSelectPrompt}</p>
          <button type="button" className="toggle-button toggle-active" onClick={selectAllSectors}>
            {labels.heatmapShowAll}
          </button>
        </div>
      ) : null}

      {/* Zoomable heatmap container */}
      {initialized ? (
      <div
        ref={containerRef}
        className="heatmap-viewport"
        data-testid="heatmap-viewport"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ cursor: zoom > 1 ? "grab" : "default" }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="chart-svg wide exec-chart-svg"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "0 0",
          }}
        >
          {auditTypes.map((t, ti) => {
            const tx = marginLeft + ti * cellSize + cellSize / 2;
            const ty = marginTop - 10;
            return (
              <text key={`h-${t}`}
                x={tx} y={ty}
                textAnchor="start" className="axis-label" fontSize={8}
                transform={`rotate(-55, ${tx}, ${ty})`}
              >{t.slice(0, 22)}</text>
            );
          })}
          {sectors.map((s, si) => (
            <text key={`r-${s}`}
              x={marginLeft - 4} y={marginTop + si * cellSize + cellSize / 2 + 3}
              textAnchor="end" className="axis-label" fontSize={8}
            >{s.slice(0, 18)}</text>
          ))}
          {sectors.map((s, si) =>
            auditTypes.map((t, ti) => {
              const cell = cellLookup.get(`${s}|||${t}`);
              const count = cell?.count ?? 0;
              const isEmpty = count === 0;
              const x = marginLeft + ti * cellSize + 2;
              const y = marginTop + si * cellSize + 2;
              const w = cellSize - 4;
              const h = cellSize - 4;

              if (isEmpty) {
                const gapTip = lang === "pt-BR"
                  ? `${s} × ${t}: Nenhuma auditoria registrada — lacuna de cobertura. Risco de não-conformidade IATF 16949 §9.2.`
                  : `${s} × ${t}: No audits recorded — coverage gap. IATF 16949 §9.2 non-conformance risk.`;
                return (
                  <g key={`cell-${si}-${ti}`}
                    data-testid={`heatmap-cell-empty-${si}-${ti}`}
                    data-empty="true" data-palette="cividis" data-volume="0"
                    style={{ cursor: "pointer" }}
                    onClick={() => onDrillDown?.({ field: "sector", value: s })}
                    onMouseEnter={(e) => show(gapTip, e)}
                    onMouseMove={move} onMouseLeave={hide}
                  >
                    <rect x={x} y={y} width={w} height={h} rx={3} fill="#4b202040" stroke="#ef444480" strokeDasharray="3 2" />
                    <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize={8} fill="#ef4444">
                      {labels.heatmapGapLabel}
                    </text>
                  </g>
                );
              }

              const adherenceStr = cell?.adherence_pct != null
                ? `${cell.adherence_pct.toFixed(0)}% ${lang === "pt-BR" ? "aderência ao plano" : "plan adherence"}`
                : labels.heatmapAdherenceLabel;
              const sampleNote = cell?.sample_sufficient
                ? ""
                : ` (${labels.heatmapSmallSample})`;
              const tooltipText = [
                `${s} × ${t}`,
                `${count} ${lang === "pt-BR" ? "auditorias" : "audits"}${sampleNote}`,
                adherenceStr,
                lang === "pt-BR" ? "Clique para filtrar por este setor" : "Click to filter by this sector",
              ].join(" — ");

              return (
                <g key={`cell-${si}-${ti}`}
                  data-testid={`heatmap-cell-${si}-${ti}`}
                  data-palette="cividis" data-volume={String(count)}
                  style={{ cursor: "pointer" }}
                  onClick={() => onDrillDown?.({ field: "sector", value: s })}
                  onMouseEnter={(e) => show(tooltipText, e)}
                  onMouseMove={move} onMouseLeave={hide}
                >
                  <rect x={x} y={y} width={w} height={h} rx={3} fill={colorScale(count)} />
                  <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize={9} fill={textFillFor(count)}>
                    {count}
                  </text>
                </g>
              );
            }),
          )}
        </svg>
      </div>
      ) : null}

      {/* Color scale legend */}
      <div className="exec-chart-legend exec-chart-legend-scale">
        <span className="exec-legend-label">{lang === "pt-BR" ? "Volume" : "Volume"}:</span>
        <div className="exec-scale-bar">
          {scaleValues.map((v, i) => (
            <span key={i} className="exec-scale-stop">
              <span className="exec-legend-swatch exec-legend-swatch-square" style={{ background: colorScale(v) }} />
              <span className="exec-scale-value">{v}</span>
            </span>
          ))}
        </div>
        <span className="exec-legend-item">
          <span className="exec-legend-swatch exec-legend-swatch-square exec-legend-swatch-gap" />
          gap
        </span>
      </div>

      <ChartTooltip content={tip?.content ?? null} x={tip?.x} y={tip?.y} />
    </section>
  );
}
