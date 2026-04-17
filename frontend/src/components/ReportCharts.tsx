import * as d3 from "d3";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { classifyVdaBand, getFieldMeta } from "../lib/reportSemantics";
import { InfoTip } from "./InfoTip";

type ReportRecord = Record<string, unknown>;

type ChartType = "pie" | "bar" | "combo" | "grouped-bar" | "gauge" | "trend-line" | "funnel" | "heatmap" | "horizontal-bar";

type ChartSuggestion = {
  id: string;
  chartType: ChartType;
  title: string;
  description: string;
  categoryField: string;
  valueField?: string;
  dateField?: string;
  groupField?: string;
  secondaryField?: string;
  targetValue?: number;
  alertThreshold?: number;
  useAverage?: boolean;
  bandType?: "vda-score";
};

type Locale = "pt-BR" | "en-US";

type ChartLabels = {
  chartPie: string;
  chartBar: string;
  chartCombo: string;
  chartNoData: string;
  chartLegendCount: string;
  chartLegendAverage: string;
  suggestedGrouping: string;
  chartGroupingLabel: string;
  movingAverageLabel: string;
  targetLineLabel: string;
  withinSlaLabel: string;
  overSlaLabel: string;
  slaAlert: string;
  vdaBandA: string;
  vdaBandB: string;
  vdaBandC: string;
};

type ChartProps = {
  reportId: string;
  rows: ReportRecord[];
  suggestion: ChartSuggestion;
  labels: ChartLabels;
  locale: Locale;
  onDrillDown?: (filter: { field: string; value: string }) => void;
};

type AggregatedDatum = {
  label: string;
  count: number;
  average: number | null;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = Number(value.replace(",", "."));
    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }

  return null;
}

function formatLabelValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "(empty)";
  }

  return String(value);
}

function getGroupingCandidates(rows: ReportRecord[], preferredField: string): string[] {
  if (rows.length === 0) {
    return [preferredField];
  }

  const orderedFields = Object.keys(rows[0] ?? {});
  const candidates = orderedFields.filter((field) => {
    const values = rows
      .map((row) => row[field])
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map((value) => String(value).trim());

    if (values.length === 0) {
      return false;
    }

    const uniqueCount = new Set(values).size;
    return uniqueCount >= 2 && uniqueCount <= 12;
  });

  if (candidates.includes(preferredField)) {
    return [preferredField, ...candidates.filter((field) => field !== preferredField)];
  }

  return [preferredField, ...candidates].filter((field, index, list) => list.indexOf(field) === index);
}

function aggregateByCategory(
  rows: ReportRecord[],
  categoryField: string,
  valueField?: string,
): AggregatedDatum[] {
  const grouped = d3.rollups(
    rows,
    (groupRows) => {
      const numericValues = valueField
        ? groupRows.map((row) => toNumber(row[valueField])).filter((value): value is number => value !== null)
        : [];

      return {
        count: groupRows.length,
        average:
          numericValues.length > 0
            ? numericValues.reduce((accumulator, value) => accumulator + value, 0) / numericValues.length
            : null,
      };
    },
    (row) => formatLabelValue(row[categoryField]),
  );

  return grouped
    .map(([label, metrics]) => ({
      label,
      count: metrics.count,
      average: metrics.average,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);
}

function aggregateByDate(
  rows: ReportRecord[],
  dateField: string,
  valueField?: string,
): AggregatedDatum[] {
  return aggregateByCategory(
    rows.map((row) => ({
      ...row,
      [dateField]: formatLabelValue(row[dateField]).slice(0, 10),
    })),
    dateField,
    valueField,
  ).sort((left, right) => left.label.localeCompare(right.label));
}

function ChartFrame({
  title,
  subtitle,
  tooltip,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  tooltip: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="chart-card">
      <div className="chart-card-header">
        <div>
          <h4>
            {title}
            <InfoTip content={tooltip} />
          </h4>
          <p>{subtitle}</p>
        </div>
        {actions ? <div className="chart-card-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

function PieChart({
  title,
  subtitle,
  tooltip,
  data,
  labels,
  onDrillDown,
  categoryField,
  actions,
}: {
  title: string;
  subtitle: string;
  tooltip: string;
  data: AggregatedDatum[];
  labels: ChartLabels;
  onDrillDown?: (filter: { field: string; value: string }) => void;
  categoryField: string;
  actions?: ReactNode;
}) {
  const [activeSlice, setActiveSlice] = useState<string | null>(null);
  const totalCount = useMemo(
    () => data.reduce((accumulator, datum) => accumulator + datum.count, 0),
    [data],
  );

  const arcs = useMemo(() => {
    const pie = d3.pie<AggregatedDatum>().value((datum) => datum.count).sort(null);
    return pie(data);
  }, [data]);

  const arcGenerator = d3.arc<d3.PieArcDatum<AggregatedDatum>>().innerRadius(56).outerRadius(98);
  const colorScale = d3.scaleOrdinal<string>().domain(data.map((datum) => datum.label)).range(d3.schemeTableau10);

  return (
    <ChartFrame title={title} subtitle={subtitle} tooltip={tooltip} actions={actions}>
      {data.length === 0 ? (
        <p className="status-copy">{labels.chartNoData}</p>
      ) : (
        <div className="chart-layout">
          <div className="chart-pie-shell">
            <svg className="chart-svg chart-svg-pie" viewBox="0 0 260 260" role="img" aria-label={labels.chartPie}>
              <g transform="translate(130,130)">
              {arcs.map((arc) => (
                <path
                  key={arc.data.label}
                  d={arcGenerator(arc) ?? ""}
                  fill={colorScale(arc.data.label)}
                  stroke="rgba(15, 23, 42, 0.95)"
                  strokeWidth={2}
                  opacity={activeSlice && activeSlice !== arc.data.label ? 0.35 : 1}
                  onMouseEnter={() => setActiveSlice(arc.data.label)}
                  onMouseLeave={() => setActiveSlice(null)}
                  onClick={() => onDrillDown?.({ field: categoryField, value: arc.data.label })}
                />
              ))}
                <text className="chart-pie-total-value" textAnchor="middle" y="-4">
                  {totalCount}
                </text>
                <text className="chart-pie-total-label" textAnchor="middle" y="16">
                  Total
                </text>
              </g>
            </svg>
          </div>
          <div className="chart-legend">
            {data.map((datum) => (
              <button
                type="button"
                className="legend-item"
                key={datum.label}
                onMouseEnter={() => setActiveSlice(datum.label)}
                onMouseLeave={() => setActiveSlice(null)}
                onClick={() => onDrillDown?.({ field: categoryField, value: datum.label })}
              >
                <span
                  className="legend-swatch"
                  style={{ backgroundColor: colorScale(datum.label) }}
                />
                <span>
                  {datum.label}: {datum.count}{" "}
                  <strong>
                    ({totalCount > 0 ? Math.round((datum.count / totalCount) * 100) : 0}%)
                  </strong>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </ChartFrame>
  );
}

function BarChart({
  title,
  subtitle,
  tooltip,
  data,
  labels,
  onDrillDown,
  categoryField,
}: {
  title: string;
  subtitle: string;
  tooltip: string;
  data: AggregatedDatum[];
  labels: ChartLabels;
  onDrillDown?: (filter: { field: string; value: string }) => void;
  categoryField: string;
}) {
  const [activeBar, setActiveBar] = useState<string | null>(null);

  const width = 420;
  const height = 240;
  const margin = { top: 16, right: 20, bottom: 48, left: 48 };
  const xScale = d3
    .scaleBand<string>()
    .domain(data.map((datum) => datum.label))
    .range([margin.left, width - margin.right])
    .padding(0.22);
  const maxValue = d3.max(data, (datum) => datum.count) ?? 1;
  const yScale = d3.scaleLinear().domain([0, maxValue]).nice().range([height - margin.bottom, margin.top]);

  return (
    <ChartFrame title={title} subtitle={subtitle} tooltip={tooltip}>
      {data.length === 0 ? (
        <p className="status-copy">{labels.chartNoData}</p>
      ) : (
        <svg className="chart-svg wide" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={labels.chartBar}>
          {data.map((datum) => {
            const x = xScale(datum.label) ?? 0;
            const y = yScale(datum.count);
            const barHeight = height - margin.bottom - y;

            return (
              <g key={datum.label}>
                <rect
                  x={x}
                  y={y}
                  width={xScale.bandwidth()}
                  height={barHeight}
                  rx={12}
                  fill={activeBar && activeBar !== datum.label ? "rgba(248, 250, 252, 0.24)" : "#fb923c"}
                  onMouseEnter={() => setActiveBar(datum.label)}
                  onMouseLeave={() => setActiveBar(null)}
                  onClick={() => onDrillDown?.({ field: categoryField, value: datum.label })}
                />
                <text x={x + xScale.bandwidth() / 2} y={y - 8} textAnchor="middle" className="chart-label">
                  {datum.count}
                </text>
                <text
                  x={x + xScale.bandwidth() / 2}
                  y={height - margin.bottom + 18}
                  textAnchor="middle"
                  className="axis-label"
                  transform={`rotate(-32 ${x + xScale.bandwidth() / 2} ${height - margin.bottom + 18})`}
                >
                  {datum.label.slice(0, 14)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </ChartFrame>
  );
}

function ComboChart({
  title,
  subtitle,
  tooltip,
  data,
  labels,
  onDrillDown,
  drilldownField,
}: {
  title: string;
  subtitle: string;
  tooltip: string;
  data: AggregatedDatum[];
  labels: ChartLabels;
  onDrillDown?: (filter: { field: string; value: string }) => void;
  drilldownField: string;
}) {
  const width = 520;
  const height = 260;
  const margin = { top: 18, right: 40, bottom: 52, left: 44 };
  const xScale = d3
    .scaleBand<string>()
    .domain(data.map((datum) => datum.label))
    .range([margin.left, width - margin.right])
    .padding(0.25);
  const yScaleCount = d3
    .scaleLinear()
    .domain([0, d3.max(data, (datum) => datum.count) ?? 1])
    .nice()
    .range([height - margin.bottom, margin.top]);
  const averageValues = data.map((datum) => datum.average ?? 0);
  const yScaleAverage = d3
    .scaleLinear()
    .domain([0, d3.max(averageValues) ?? 1])
    .nice()
    .range([height - margin.bottom, margin.top]);
  const line = d3
    .line<AggregatedDatum>()
    .x((datum) => (xScale(datum.label) ?? 0) + xScale.bandwidth() / 2)
    .y((datum) => yScaleAverage(datum.average ?? 0));

  return (
    <ChartFrame title={title} subtitle={subtitle} tooltip={tooltip}>
      {data.length === 0 ? (
        <p className="status-copy">{labels.chartNoData}</p>
      ) : (
        <>
          <svg className="chart-svg wide" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={labels.chartCombo}>
            {data.map((datum) => {
              const x = xScale(datum.label) ?? 0;
              const y = yScaleCount(datum.count);
              const barHeight = height - margin.bottom - y;

              return (
                <g key={datum.label}>
                  <rect
                    x={x}
                    y={y}
                    width={xScale.bandwidth()}
                    height={barHeight}
                    rx={10}
                    fill="rgba(96, 165, 250, 0.65)"
                    onClick={() => onDrillDown?.({ field: drilldownField, value: datum.label })}
                  />
                  <text
                    x={x + xScale.bandwidth() / 2}
                    y={height - margin.bottom + 18}
                    textAnchor="middle"
                    className="axis-label"
                  >
                    {datum.label.slice(0, 10)}
                  </text>
                </g>
              );
            })}
            <path d={line(data) ?? ""} fill="none" stroke="#f59e0b" strokeWidth={3} />
            {data.map((datum) => (
              <circle
                key={`${datum.label}-point`}
                cx={(xScale(datum.label) ?? 0) + xScale.bandwidth() / 2}
                cy={yScaleAverage(datum.average ?? 0)}
                r={5}
                fill="#f59e0b"
                onClick={() => onDrillDown?.({ field: drilldownField, value: datum.label })}
              />
            ))}
          </svg>
          <div className="chart-caption">
            <span>{labels.chartLegendCount}</span>
            <span>{labels.chartLegendAverage}</span>
          </div>
        </>
      )}
    </ChartFrame>
  );
}

function computeMovingAverage(data: AggregatedDatum[], window: number): (number | null)[] {
  return data.map((_, index) => {
    const start = Math.max(0, index - Math.floor(window / 2));
    const end = Math.min(data.length, start + window);
    const slice = data.slice(start, end);
    if (slice.length === 0) {
      return null;
    }

    return slice.reduce((sum, datum) => sum + datum.count, 0) / slice.length;
  });
}

function vdaBandFill(band: "A" | "B" | "C"): string {
  if (band === "A") return "rgba(34, 197, 94, 0.45)";
  if (band === "B") return "rgba(245, 158, 11, 0.45)";
  return "rgba(239, 68, 68, 0.45)";
}

function TrendLineChart({
  title,
  subtitle,
  tooltip,
  data,
  labels,
  onDrillDown,
  categoryField,
  targetValue,
  bandType,
}: {
  title: string;
  subtitle: string;
  tooltip: string;
  data: AggregatedDatum[];
  labels: ChartLabels;
  onDrillDown?: (filter: { field: string; value: string }) => void;
  categoryField: string;
  targetValue?: number;
  bandType?: "vda-score";
}) {
  const width = 520;
  const height = 260;
  const margin = { top: 18, right: 40, bottom: 52, left: 44 };
  const movingAvg = useMemo(() => computeMovingAverage(data, 3), [data]);

  const xScale = d3
    .scaleBand<string>()
    .domain(data.map((datum) => datum.label))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const maxCount = d3.max(data, (datum) => datum.count) ?? 1;
  const yScale = d3
    .scaleLinear()
    .domain([0, Math.max(maxCount, targetValue ?? 0)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const linePath = d3
    .line<AggregatedDatum>()
    .x((datum) => (xScale(datum.label) ?? 0) + xScale.bandwidth() / 2)
    .y((datum) => yScale(datum.count));

  const maLinePath = d3
    .line<{ x: number; y: number | null }>()
    .defined((point) => point.y !== null)
    .x((point) => point.x)
    .y((point) => yScale(point.y ?? 0));

  const maPoints = data.map((datum, index) => ({
    x: (xScale(datum.label) ?? 0) + xScale.bandwidth() / 2,
    y: movingAvg[index] ?? null,
  }));

  return (
    <ChartFrame title={title} subtitle={subtitle} tooltip={tooltip}>
      {data.length === 0 ? (
        <p className="status-copy">{labels.chartNoData}</p>
      ) : (
        <>
          <svg
            className="chart-svg wide"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={title}
          >
            {data.map((datum) => {
              const x = xScale(datum.label) ?? 0;
              const y = yScale(datum.count);
              const fill =
                bandType === "vda-score"
                  ? vdaBandFill(classifyVdaBand(datum.count))
                  : "rgba(96, 165, 250, 0.35)";
              return (
                <rect
                  key={datum.label}
                  x={x}
                  y={y}
                  width={xScale.bandwidth()}
                  height={height - margin.bottom - y}
                  rx={6}
                  fill={fill}
                  onClick={() => onDrillDown?.({ field: categoryField, value: datum.label })}
                />
              );
            })}
            <path d={linePath(data) ?? ""} fill="none" stroke="#60a5fa" strokeWidth={2} />
            <path d={maLinePath(maPoints) ?? ""} fill="none" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="5 3" />
            {targetValue !== undefined ? (
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={yScale(targetValue)}
                y2={yScale(targetValue)}
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="6 3"
              />
            ) : null}
            {data.map((datum) => {
              const x = (xScale(datum.label) ?? 0) + xScale.bandwidth() / 2;
              return (
                <text
                  key={`${datum.label}-label`}
                  x={x}
                  y={height - margin.bottom + 18}
                  textAnchor="middle"
                  className="axis-label"
                  transform={`rotate(-32 ${x} ${height - margin.bottom + 18})`}
                >
                  {datum.label.slice(0, 10)}
                </text>
              );
            })}
          </svg>
          <div className="chart-caption">
            <span>{labels.chartLegendCount}</span>
            <span>{labels.movingAverageLabel}</span>
            {targetValue !== undefined ? <span>{labels.targetLineLabel}</span> : null}
          </div>
        </>
      )}
    </ChartFrame>
  );
}

function FunnelChart({
  title,
  subtitle,
  tooltip,
  data,
  labels,
  onDrillDown,
  categoryField,
}: {
  title: string;
  subtitle: string;
  tooltip: string;
  data: AggregatedDatum[];
  labels: ChartLabels;
  onDrillDown?: (filter: { field: string; value: string }) => void;
  categoryField: string;
}) {
  const width = 480;
  const rowHeight = 36;
  const gap = 6;
  const height = data.length * (rowHeight + gap) + 20;
  const maxCount = d3.max(data, (datum) => datum.count) ?? 1;
  const colorScale = d3
    .scaleSequential(d3.interpolateCividis)
    .domain([0, maxCount]);

  return (
    <ChartFrame title={title} subtitle={subtitle} tooltip={tooltip}>
      {data.length === 0 ? (
        <p className="status-copy">{labels.chartNoData}</p>
      ) : (
        <svg
          className="chart-svg wide"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={title}
        >
          {data.map((datum, index) => {
            const barWidth = Math.max(40, (datum.count / maxCount) * (width - 120));
            const y = index * (rowHeight + gap) + 10;
            return (
              <g key={datum.label}>
                <rect
                  x={0}
                  y={y}
                  width={barWidth}
                  height={rowHeight}
                  rx={4}
                  fill={colorScale(datum.count)}
                  onClick={() => onDrillDown?.({ field: categoryField, value: datum.label })}
                  style={{ cursor: "pointer" }}
                />
                <text x={barWidth + 8} y={y + rowHeight / 2 + 4} className="chart-label">
                  {datum.label.slice(0, 20)} ({datum.count})
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </ChartFrame>
  );
}

function HeatmapChart({
  title,
  subtitle,
  tooltip,
  rows,
  labels,
  onDrillDown,
  categoryField,
  secondaryField,
}: {
  title: string;
  subtitle: string;
  tooltip: string;
  rows: ReportRecord[];
  labels: ChartLabels;
  onDrillDown?: (filter: { field: string; value: string }) => void;
  categoryField: string;
  secondaryField: string;
}) {
  const { matrix, xLabels, yLabels } = useMemo(() => {
    const xSet = new Set<string>();
    const ySet = new Set<string>();
    const counts = new Map<string, number>();

    for (const row of rows) {
      const x = String(row[categoryField] ?? "");
      const y = String(row[secondaryField] ?? "");
      if (!x || !y) {
        continue;
      }

      xSet.add(x);
      ySet.add(y);
      const key = `${x}|||${y}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const xLabelsArr = [...xSet].slice(0, 8);
    const yLabelsArr = [...ySet].slice(0, 8);
    const matrixArr = yLabelsArr.map((y) =>
      xLabelsArr.map((x) => counts.get(`${x}|||${y}`) ?? 0),
    );

    return { matrix: matrixArr, xLabels: xLabelsArr, yLabels: yLabelsArr };
  }, [rows, categoryField, secondaryField]);

  if (xLabels.length === 0 || yLabels.length === 0) {
    return (
      <ChartFrame title={title} subtitle={subtitle} tooltip={tooltip}>
        <p className="status-copy">{labels.chartNoData}</p>
      </ChartFrame>
    );
  }

  const cellSize = 44;
  const marginLeft = 100;
  const marginTop = 40;
  const svgWidth = marginLeft + xLabels.length * cellSize + 10;
  const svgHeight = marginTop + yLabels.length * cellSize + 10;
  const maxValue = Math.max(1, ...matrix.flat());
  const colorScale = d3.scaleSequential(d3.interpolateCividis).domain([0, maxValue]);
  const textFillFor = (value: number) =>
    d3.lab(colorScale(value)).l > 60 ? "#1e293b" : "rgba(243, 239, 231, 0.78)";

  return (
    <ChartFrame title={title} subtitle={subtitle} tooltip={tooltip}>
      <svg
        className="chart-svg wide"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        role="img"
        aria-label={title}
      >
        {xLabels.map((xLabel, xi) => (
          <text
            key={`x-${xLabel}`}
            x={marginLeft + xi * cellSize + cellSize / 2}
            y={marginTop - 6}
            textAnchor="middle"
            className="axis-label"
          >
            {xLabel.slice(0, 8)}
          </text>
        ))}
        {yLabels.map((yLabel, yi) => (
          <text
            key={`y-${yLabel}`}
            x={marginLeft - 6}
            y={marginTop + yi * cellSize + cellSize / 2 + 4}
            textAnchor="end"
            className="axis-label"
          >
            {yLabel.slice(0, 14)}
          </text>
        ))}
        {matrix.map((row, yi) =>
          row.map((value, xi) => (
            <rect
              key={`cell-${xi}-${yi}`}
              x={marginLeft + xi * cellSize + 2}
              y={marginTop + yi * cellSize + 2}
              width={cellSize - 4}
              height={cellSize - 4}
              rx={4}
              fill={value === 0 ? "rgba(248,250,252,0.08)" : colorScale(value)}
              onClick={() =>
                onDrillDown?.({ field: categoryField, value: xLabels[xi] ?? "" })
              }
              style={{ cursor: value > 0 ? "pointer" : "default" }}
            >
              <title>{`${xLabels[xi]} × ${yLabels[yi]}: ${value}`}</title>
            </rect>
          )),
        )}
        {matrix.map((row, yi) =>
          row.map((value, xi) =>
            value > 0 ? (
              <text
                key={`val-${xi}-${yi}`}
                x={marginLeft + xi * cellSize + cellSize / 2}
                y={marginTop + yi * cellSize + cellSize / 2 + 4}
                textAnchor="middle"
                fill={textFillFor(value)}
                fontSize={11}
              >
                {value}
              </text>
            ) : null,
          ),
        )}
      </svg>
    </ChartFrame>
  );
}

function GaugeChart({
  title,
  subtitle,
  tooltip,
  rows,
  labels,
  categoryField,
  targetValue,
  alertThreshold,
}: {
  title: string;
  subtitle: string;
  tooltip: string;
  rows: ReportRecord[];
  labels: ChartLabels;
  categoryField: string;
  targetValue?: number;
  alertThreshold?: number;
}) {
  const { withinCount, overCount, total } = useMemo(() => {
    const now = new Date();
    let within = 0;
    let over = 0;
    const threshold = targetValue ?? 60;

    for (const row of rows) {
      const rawDate = String(row[categoryField] ?? "").slice(0, 10);
      if (!rawDate || rawDate === "null") {
        continue;
      }

      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) {
        continue;
      }

      const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= threshold) {
        within++;
      } else {
        over++;
      }
    }

    return { withinCount: within, overCount: over, total: within + over };
  }, [rows, categoryField, targetValue]);

  const withinPct = total > 0 ? Math.round((withinCount / total) * 100) : 0;
  const overPct = 100 - withinPct;
  const isAlert = alertThreshold !== undefined && overPct > alertThreshold;

  const radius = 80;
  const cx = 130;
  const cy = 100;
  const innerRadius = 52;
  const arc = d3.arc<{ startAngle: number; endAngle: number }>().innerRadius(innerRadius).outerRadius(radius);
  const fullAngle = 2 * Math.PI;
  const withinAngle = (withinPct / 100) * fullAngle;

  return (
    <ChartFrame title={title} subtitle={subtitle} tooltip={tooltip}>
      {total === 0 ? (
        <p className="status-copy">{labels.chartNoData}</p>
      ) : (
        <div className="chart-layout">
          <svg className="chart-svg chart-svg-pie" viewBox="0 0 260 200" role="img" aria-label={title}>
            <g transform={`translate(${cx}, ${cy})`}>
              <path
                d={
                  arc({
                    startAngle: 0,
                    endAngle: withinAngle,
                  }) ?? ""
                }
                fill="#22c55e"
              />
              <path
                d={
                  arc({
                    startAngle: withinAngle,
                    endAngle: fullAngle,
                  }) ?? ""
                }
                fill={isAlert ? "#ef4444" : "#94a3b8"}
              />
              <text textAnchor="middle" y="-6" className="chart-pie-total-value">
                {withinPct}%
              </text>
              <text textAnchor="middle" y="14" className="chart-pie-total-label">
                {labels.withinSlaLabel}
              </text>
            </g>
          </svg>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-swatch" style={{ backgroundColor: "#22c55e" }} />
              <span>
                {labels.withinSlaLabel}: {withinCount}
              </span>
            </div>
            <div className={`legend-item ${isAlert ? "legend-item-alert" : ""}`}>
              <span className="legend-swatch" style={{ backgroundColor: isAlert ? "#ef4444" : "#94a3b8" }} />
              <span>
                {labels.overSlaLabel}: {overCount}
                {isAlert ? ` ⚠ ${labels.slaAlert}` : ""}
              </span>
            </div>
          </div>
        </div>
      )}
    </ChartFrame>
  );
}

function GroupedBarChart({
  title,
  subtitle,
  tooltip,
  rows,
  labels,
  onDrillDown,
  categoryField,
  groupField,
}: {
  title: string;
  subtitle: string;
  tooltip: string;
  rows: ReportRecord[];
  labels: ChartLabels;
  onDrillDown?: (filter: { field: string; value: string }) => void;
  categoryField: string;
  groupField: string;
}) {
  const { categories, groups, matrix } = useMemo(() => {
    const catSet = new Set<string>();
    const grpSet = new Set<string>();
    const counts = new Map<string, number>();

    for (const row of rows) {
      const cat = String(row[categoryField] ?? "");
      const grp = String(row[groupField] ?? "");
      if (!cat || !grp) {
        continue;
      }

      catSet.add(cat);
      grpSet.add(grp);
      const key = `${cat}|||${grp}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const categoriesArr = [...catSet].slice(0, 6);
    const groupsArr = [...grpSet].slice(0, 5);
    const matrixArr = categoriesArr.map((cat) =>
      groupsArr.map((grp) => counts.get(`${cat}|||${grp}`) ?? 0),
    );

    return { categories: categoriesArr, groups: groupsArr, matrix: matrixArr };
  }, [rows, categoryField, groupField]);

  const width = 480;
  const height = 260;
  const margin = { top: 20, right: 20, bottom: 56, left: 44 };
  const colorScale = d3.scaleOrdinal<string>().domain(groups).range(d3.schemeTableau10);
  const xScale = d3
    .scaleBand<string>()
    .domain(categories)
    .range([margin.left, width - margin.right])
    .padding(0.25);
  const groupScale = d3
    .scaleBand<string>()
    .domain(groups)
    .range([0, xScale.bandwidth()])
    .padding(0.05);
  const maxValue = Math.max(1, ...matrix.flat());
  const yScale = d3
    .scaleLinear()
    .domain([0, maxValue])
    .nice()
    .range([height - margin.bottom, margin.top]);

  return (
    <ChartFrame title={title} subtitle={subtitle} tooltip={tooltip}>
      {categories.length === 0 ? (
        <p className="status-copy">{labels.chartNoData}</p>
      ) : (
        <>
          <svg
            className="chart-svg wide"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={title}
          >
            {matrix.map((groupCounts, ci) => {
              const catX = xScale(categories[ci] ?? "") ?? 0;
              return groupCounts.map((count, gi) => {
                const grp = groups[gi] ?? "";
                const x = catX + (groupScale(grp) ?? 0);
                const y = yScale(count);
                return (
                  <rect
                    key={`${ci}-${gi}`}
                    x={x}
                    y={y}
                    width={groupScale.bandwidth()}
                    height={height - margin.bottom - y}
                    rx={4}
                    fill={colorScale(grp)}
                    onClick={() => onDrillDown?.({ field: categoryField, value: categories[ci] ?? "" })}
                    style={{ cursor: "pointer" }}
                  />
                );
              });
            })}
            {categories.map((cat) => {
              const x = (xScale(cat) ?? 0) + xScale.bandwidth() / 2;
              return (
                <text
                  key={`cat-${cat}`}
                  x={x}
                  y={height - margin.bottom + 18}
                  textAnchor="middle"
                  className="axis-label"
                  transform={`rotate(-28 ${x} ${height - margin.bottom + 18})`}
                >
                  {cat.slice(0, 12)}
                </text>
              );
            })}
          </svg>
          <div className="chart-legend">
            {groups.map((grp) => (
              <div key={grp} className="legend-item">
                <span className="legend-swatch" style={{ backgroundColor: colorScale(grp) }} />
                <span>{grp}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </ChartFrame>
  );
}

function HorizontalBarChart({
  title,
  subtitle,
  tooltip,
  data,
  labels,
  onDrillDown,
  categoryField,
  alertThreshold,
}: {
  title: string;
  subtitle: string;
  tooltip: string;
  data: AggregatedDatum[];
  labels: ChartLabels;
  onDrillDown?: (filter: { field: string; value: string }) => void;
  categoryField: string;
  alertThreshold?: number;
}) {
  const topData = useMemo(() => data.slice(0, 10), [data]);
  const total = useMemo(() => topData.reduce((sum, datum) => sum + datum.count, 0), [topData]);
  const width = 480;
  const rowHeight = 32;
  const gap = 4;
  const marginLeft = 140;
  const height = topData.length * (rowHeight + gap) + 20;
  const maxCount = d3.max(topData, (datum) => datum.count) ?? 1;
  const xScale = d3.scaleLinear().domain([0, maxCount]).range([0, width - marginLeft - 60]);

  return (
    <ChartFrame title={title} subtitle={subtitle} tooltip={tooltip}>
      {topData.length === 0 ? (
        <p className="status-copy">{labels.chartNoData}</p>
      ) : (
        <svg
          className="chart-svg wide"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={title}
        >
          {topData.map((datum, index) => {
            const y = index * (rowHeight + gap) + 10;
            const barWidth = xScale(datum.count);
            const pct = total > 0 ? Math.round((datum.count / total) * 100) : 0;
            const isAlert = alertThreshold !== undefined && pct > alertThreshold;
            return (
              <g key={datum.label}>
                <text x={marginLeft - 6} y={y + rowHeight / 2 + 4} textAnchor="end" className="axis-label">
                  {datum.label.slice(0, 18)}
                </text>
                <rect
                  x={marginLeft}
                  y={y}
                  width={barWidth}
                  height={rowHeight}
                  rx={4}
                  fill={isAlert ? "#ef4444" : "#fb923c"}
                  onClick={() => onDrillDown?.({ field: categoryField, value: datum.label })}
                  style={{ cursor: "pointer" }}
                />
                <text x={marginLeft + barWidth + 6} y={y + rowHeight / 2 + 4} className="chart-label">
                  {datum.count} ({pct}%){isAlert ? " ⚠" : ""}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </ChartFrame>
  );
}

export function ReportCharts({ reportId, rows, suggestion, labels, locale, onDrillDown }: ChartProps) {
  const groupingCandidates = useMemo(
    () => getGroupingCandidates(rows, suggestion.categoryField),
    [rows, suggestion.categoryField],
  );
  const [selectedPieGrouping, setSelectedPieGrouping] = useState(suggestion.categoryField);

  useEffect(() => {
    if (suggestion.chartType !== "pie") {
      return;
    }

    setSelectedPieGrouping((currentGrouping) =>
      groupingCandidates.includes(currentGrouping) ? currentGrouping : suggestion.categoryField,
    );
  }, [groupingCandidates, suggestion.categoryField, suggestion.chartType]);

  const effectiveCategoryField =
    suggestion.chartType === "pie" ? selectedPieGrouping : suggestion.categoryField;

  const chartData = useMemo(() => {
    if (suggestion.chartType === "combo" && suggestion.dateField) {
      return aggregateByDate(rows, suggestion.dateField, suggestion.valueField);
    }

    if (suggestion.useAverage && suggestion.chartType === "trend-line") {
      const byDate = aggregateByDate(rows, suggestion.categoryField, suggestion.valueField);
      return byDate.map((datum) => ({ ...datum, count: datum.average ?? datum.count }));
    }

    return aggregateByCategory(rows, effectiveCategoryField, suggestion.valueField);
  }, [effectiveCategoryField, rows, suggestion]);

  const categoryLabel =
    getFieldMeta(reportId, effectiveCategoryField)?.label[locale] ?? effectiveCategoryField;
  const valueLabel = suggestion.valueField
    ? getFieldMeta(reportId, suggestion.valueField)?.label[locale] ?? suggestion.valueField
    : null;
  const dateLabel = suggestion.dateField
    ? getFieldMeta(reportId, suggestion.dateField)?.label[locale] ?? suggestion.dateField
    : null;
  const tooltip = [
    suggestion.description,
    `${labels.suggestedGrouping}: ${categoryLabel}`,
    valueLabel ? `Métrica: ${valueLabel}` : null,
    dateLabel ? `Eixo temporal: ${dateLabel}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  if (suggestion.chartType === "pie") {
    return (
      <PieChart
        title={suggestion.title}
        subtitle={suggestion.description}
        data={chartData}
        labels={labels}
        tooltip={tooltip}
        categoryField={effectiveCategoryField}
        onDrillDown={onDrillDown}
        actions={
          <label className="chart-grouping-control">
            <span>{labels.chartGroupingLabel}</span>
            <select
              value={selectedPieGrouping}
              onChange={(event) => setSelectedPieGrouping(event.target.value)}
            >
              {groupingCandidates.map((field) => {
                const fieldLabel = getFieldMeta(reportId, field)?.label[locale] ?? field;
                return (
                  <option key={field} value={field}>
                    {fieldLabel}
                  </option>
                );
              })}
            </select>
          </label>
        }
      />
    );
  }

  if (suggestion.chartType === "bar") {
    return (
      <BarChart
        title={suggestion.title}
        subtitle={suggestion.description}
        data={chartData}
        labels={labels}
        tooltip={tooltip}
        categoryField={suggestion.categoryField}
        onDrillDown={onDrillDown}
      />
    );
  }

  if (suggestion.chartType === "funnel") {
    return (
      <FunnelChart
        title={suggestion.title}
        subtitle={suggestion.description}
        data={chartData}
        labels={labels}
        tooltip={tooltip}
        categoryField={suggestion.categoryField}
        onDrillDown={onDrillDown}
      />
    );
  }

  if (suggestion.chartType === "heatmap") {
    return (
      <HeatmapChart
        title={suggestion.title}
        subtitle={suggestion.description}
        rows={rows}
        labels={labels}
        tooltip={tooltip}
        categoryField={suggestion.categoryField}
        secondaryField={suggestion.secondaryField ?? suggestion.categoryField}
        onDrillDown={onDrillDown}
      />
    );
  }

  if (suggestion.chartType === "trend-line") {
    return (
      <TrendLineChart
        title={suggestion.title}
        subtitle={suggestion.description}
        data={chartData}
        labels={labels}
        tooltip={tooltip}
        categoryField={suggestion.categoryField}
        targetValue={suggestion.targetValue}
        bandType={suggestion.bandType}
        onDrillDown={onDrillDown}
      />
    );
  }

  if (suggestion.chartType === "gauge") {
    return (
      <GaugeChart
        title={suggestion.title}
        subtitle={suggestion.description}
        rows={rows}
        labels={labels}
        tooltip={tooltip}
        categoryField={suggestion.categoryField}
        targetValue={suggestion.targetValue ?? 60}
        alertThreshold={suggestion.alertThreshold ?? 20}
      />
    );
  }

  if (suggestion.chartType === "grouped-bar") {
    return (
      <GroupedBarChart
        title={suggestion.title}
        subtitle={suggestion.description}
        rows={rows}
        labels={labels}
        tooltip={tooltip}
        categoryField={suggestion.categoryField}
        groupField={suggestion.groupField ?? suggestion.categoryField}
        onDrillDown={onDrillDown}
      />
    );
  }

  if (suggestion.chartType === "horizontal-bar") {
    return (
      <HorizontalBarChart
        title={suggestion.title}
        subtitle={suggestion.description}
        data={chartData}
        labels={labels}
        tooltip={tooltip}
        categoryField={suggestion.categoryField}
        alertThreshold={suggestion.alertThreshold}
        onDrillDown={onDrillDown}
      />
    );
  }

  return (
    <ComboChart
      title={suggestion.title}
      subtitle={suggestion.description}
      data={chartData}
      labels={labels}
      tooltip={tooltip}
      drilldownField={suggestion.dateField ?? suggestion.categoryField}
      onDrillDown={onDrillDown}
    />
  );
}
