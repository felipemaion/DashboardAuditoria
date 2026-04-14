import * as d3 from "d3";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { getFieldMeta } from "../lib/reportSemantics";
import { InfoTip } from "./InfoTip";

type ReportRecord = Record<string, unknown>;

type ChartSuggestion = {
  id: string;
  chartType: "pie" | "bar" | "combo";
  title: string;
  description: string;
  categoryField: string;
  valueField?: string;
  dateField?: string;
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
  children,
}: {
  title: string;
  subtitle: string;
  tooltip: string;
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
}: {
  title: string;
  subtitle: string;
  tooltip: string;
  data: AggregatedDatum[];
  labels: ChartLabels;
  onDrillDown?: (filter: { field: string; value: string }) => void;
  categoryField: string;
}) {
  const [activeSlice, setActiveSlice] = useState<string | null>(null);

  const arcs = useMemo(() => {
    const pie = d3.pie<AggregatedDatum>().value((datum) => datum.count).sort(null);
    return pie(data);
  }, [data]);

  const arcGenerator = d3.arc<d3.PieArcDatum<AggregatedDatum>>().innerRadius(52).outerRadius(92);
  const colorScale = d3.scaleOrdinal<string>().domain(data.map((datum) => datum.label)).range(d3.schemeTableau10);

  return (
    <ChartFrame title={title} subtitle={subtitle} tooltip={tooltip}>
      {data.length === 0 ? (
        <p className="status-copy">{labels.chartNoData}</p>
      ) : (
        <div className="chart-layout">
          <svg className="chart-svg" viewBox="0 0 240 240" role="img" aria-label={labels.chartPie}>
            <g transform="translate(120,120)">
              {arcs.map((arc) => (
                <path
                  key={arc.data.label}
                  d={arcGenerator(arc) ?? ""}
                  fill={colorScale(arc.data.label)}
                  opacity={activeSlice && activeSlice !== arc.data.label ? 0.35 : 1}
                  onMouseEnter={() => setActiveSlice(arc.data.label)}
                  onMouseLeave={() => setActiveSlice(null)}
                  onClick={() => onDrillDown?.({ field: categoryField, value: arc.data.label })}
                />
              ))}
            </g>
          </svg>
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
                  {datum.label}: {datum.count}
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

export function ReportCharts({ reportId, rows, suggestion, labels, locale, onDrillDown }: ChartProps) {
  const chartData = useMemo(() => {
    if (suggestion.chartType === "combo" && suggestion.dateField) {
      return aggregateByDate(rows, suggestion.dateField, suggestion.valueField);
    }

    return aggregateByCategory(rows, suggestion.categoryField, suggestion.valueField);
  }, [rows, suggestion]);

  const categoryLabel =
    getFieldMeta(reportId, suggestion.categoryField)?.label[locale] ?? suggestion.categoryField;
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
        categoryField={suggestion.categoryField}
        onDrillDown={onDrillDown}
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
