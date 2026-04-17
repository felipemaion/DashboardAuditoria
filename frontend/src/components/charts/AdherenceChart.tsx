import { useMemo } from "react";

import { InfoTip } from "../InfoTip";
import type { AderenciaMensalChart, BaseChartProps } from "./types";
import { ChartTooltip, useChartTooltip } from "./ChartTooltip";

const CHART_RATIONALE: Record<string, string> = {
  "pt-BR": [
    "Evolução mensal da aderência ao programa de auditorias planejadas.",
    "Cada barra empilhada mostra a composição por faixa de pontualidade: no prazo, até 30 dias, acima de 30 dias e vencida.",
    "Linha azul: % de aderência real. Linha vermelha tracejada: meta IATF 16949 de 95%.",
    "Fonte: views auditorias_planejadas × auditorias_realizadas (MySQL), join por AuditingPlanningGUID.",
    "Métrica: auditoria \"aderente\" = executada dentro de 30 dias da data planejada.",
  ].join(" "),
  "en-US": [
    "Monthly evolution of planned audit program adherence.",
    "Each stacked bar shows composition by timeliness band: on time, within 30d, over 30d, and overdue.",
    "Blue line: actual adherence %. Red dashed line: IATF 16949 target of 95%.",
    "Source: auditorias_planejadas × auditorias_realizadas views (MySQL), joined by AuditingPlanningGUID.",
    "Metric: audit is \"adherent\" = executed within 30 days of planned date.",
  ].join(" "),
};

type Props = BaseChartProps & {
  title: string;
  data: AderenciaMensalChart;
};

const SEGMENT_COLORS: Record<string, string> = {
  "on-time": "#22c55e",
  "within-30d": "#eab308",
  "over-30d": "#f97316",
  overdue: "#ef4444",
};

const SEGMENT_LABELS: Record<string, Record<string, string>> = {
  "on-time": { "pt-BR": "No prazo", "en-US": "On time" },
  "within-30d": { "pt-BR": "Até 30 dias", "en-US": "Within 30d" },
  "over-30d": { "pt-BR": "Acima de 30 dias", "en-US": "Over 30d" },
  overdue: { "pt-BR": "Vencida", "en-US": "Overdue" },
};

const SEGMENT_KEYS = ["on-time", "within-30d", "over-30d", "overdue"] as const;
const COMPACT_SEGMENT_KEYS = ["on-time", "over-30d", "overdue"] as const;
const DATA_KEY_MAP: Record<string, keyof Pick<AderenciaMensalChart["buckets"][number], "on_time" | "within_30d" | "over_30d" | "overdue">> = {
  "on-time": "on_time",
  "within-30d": "within_30d",
  "over-30d": "over_30d",
  overdue: "overdue",
};

export function AdherenceChart({ title, data, labels, locale, onDrillDown, compact }: Props) {
  const { buckets, target_pct, insight_lead } = data;
  const segmentKeys = compact ? COMPACT_SEGMENT_KEYS : SEGMENT_KEYS;
  const { tip, show, move, hide } = useChartTooltip();
  const lang = locale === "en-US" ? "en-US" : "pt-BR";

  const adherencePcts = useMemo(() => {
    return buckets.map((row) => row.adherence_pct ?? 0);
  }, [buckets]);

  const insightText = useMemo(() => {
    if (insight_lead.text) return insight_lead.text;
    if (adherencePcts.length === 0) return labels.chartInsightDefault;
    const last = adherencePcts[adherencePcts.length - 1] ?? 0;
    return `${last.toFixed(0)}% aderência no último mês`;
  }, [adherencePcts, insight_lead.text, labels.chartInsightDefault]);

  if (buckets.length === 0) {
    return (
      <section className="exec-chart-card" data-testid="chart-aderencia" data-responsive-mode={compact ? "compact" : undefined}>
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
  const width = 420;
  const height = 200;
  const margin = { top: 24, right: 16, bottom: 32, left: 36 };
  const barWidth = Math.min(36, (width - margin.left - margin.right) / buckets.length - 4);

  const maxTotal = Math.max(
    ...buckets.map((row) => {
      let sum = 0;
      for (const key of segmentKeys) sum += row[DATA_KEY_MAP[key]];
      return sum;
    }),
    1,
  );

  const yScale = (v: number) =>
    margin.top + (1 - v / maxTotal) * (height - margin.top - margin.bottom);
  const xStep = (width - margin.left - margin.right) / buckets.length;

  return (
    <section className="exec-chart-card" data-testid="chart-aderencia" data-responsive-mode={compact ? "compact" : undefined}>
      <h4 className="exec-chart-title" data-testid="chart-title">
        {title}
        <InfoTip content={CHART_RATIONALE[lang]} label={title} />
      </h4>
      <p className="exec-chart-insight" data-testid="insight-lead">{insightText}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg wide exec-chart-svg">
        {buckets.map((row, i) => {
          const x = margin.left + i * xStep + (xStep - barWidth) / 2;
          let yOffset = height - margin.bottom;
          const total = segmentKeys.reduce((s, k) => s + row[DATA_KEY_MAP[k]], 0);

          return segmentKeys.map((seg) => {
            const val = row[DATA_KEY_MAP[seg]];
            const barH = maxTotal > 0 ? (val / maxTotal) * (height - margin.top - margin.bottom) : 0;
            const y = yOffset - barH;
            yOffset = y;
            const segLabel = SEGMENT_LABELS[seg][lang];
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
            const tipText = `${row.month} — ${segLabel}: ${val} (${pct}%) | Aderência: ${(row.adherence_pct ?? 0).toFixed(1)}%`;
            return (
              <rect
                key={`${row.month}-${seg}`}
                data-testid={`bar-segment-${seg}`}
                data-segment-type={seg}
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                fill={SEGMENT_COLORS[seg]}
                rx={2}
                style={{ cursor: "pointer" }}
                onClick={() => onDrillDown?.({ field: "month", value: row.month })}
                onMouseEnter={(e) => show(tipText, e)}
                onMouseMove={move}
                onMouseLeave={hide}
              />
            );
          });
        })}

        {/* Adherence line */}
        <polyline
          data-testid="adherence-line"
          fill="none"
          stroke="#1e40af"
          strokeWidth={2}
          points={buckets
            .map((row, i) => {
              const cx = margin.left + i * xStep + xStep / 2;
              const pct = adherencePcts[i] ?? 0;
              const cy = yScale((pct / 100) * maxTotal);
              return `${cx},${cy}`;
            })
            .join(" ")}
        />

        {/* Adherence dots (hoverable) */}
        {buckets.map((row, i) => {
          const cx = margin.left + i * xStep + xStep / 2;
          const pct = adherencePcts[i] ?? 0;
          const cy = yScale((pct / 100) * maxTotal);
          return (
            <circle
              key={`dot-${row.month}`}
              cx={cx}
              cy={cy}
              r={3.5}
              fill="#1e40af"
              stroke="#f8fafc"
              strokeWidth={1.5}
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => show(`${row.month}: ${pct.toFixed(1)}% aderência`, e)}
              onMouseMove={move}
              onMouseLeave={hide}
            />
          );
        })}

        {/* Target line */}
        <line
          data-testid="target-guide-95"
          x1={margin.left}
          x2={width - margin.right}
          y1={yScale((target_pct / 100) * maxTotal)}
          y2={yScale((target_pct / 100) * maxTotal)}
          stroke="#ef4444"
          strokeWidth={1.2}
          strokeDasharray="5 3"
        />
        <text
          x={width - margin.right - 4}
          y={yScale((target_pct / 100) * maxTotal) - 4}
          textAnchor="end"
          className="chart-label"
          fill="#ef4444"
          fontSize={9}
        >
          {`Meta IATF ${target_pct}%`}
        </text>

        {/* X-axis labels */}
        {buckets.map((row, i) => (
          <text
            key={`x-${row.month}`}
            x={margin.left + i * xStep + xStep / 2}
            y={height - margin.bottom + 14}
            textAnchor="middle"
            fontSize={8}
            fill="rgba(243,239,231,0.6)"
          >
            {row.month}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="exec-chart-legend">
        {segmentKeys.map((seg) => (
          <span key={seg} className="exec-legend-item">
            <span className="exec-legend-swatch" style={{ background: SEGMENT_COLORS[seg] }} />
            {SEGMENT_LABELS[seg][lang]}
          </span>
        ))}
        <span className="exec-legend-item">
          <span className="exec-legend-line" style={{ background: "#1e40af" }} />
          {lang === "pt-BR" ? "% Aderência" : "% Adherence"}
        </span>
        <span className="exec-legend-item">
          <span className="exec-legend-line exec-legend-line-dashed" style={{ background: "#ef4444" }} />
          {`Meta ${target_pct}%`}
        </span>
      </div>

      <ChartTooltip content={tip?.content ?? null} x={tip?.x} y={tip?.y} />
    </section>
  );
}
