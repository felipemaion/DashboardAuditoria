import { InfoTip } from "../InfoTip";
import type { BaseChartProps, ReplanejamentoScatterChart } from "./types";
import { ChartTooltip, useChartTooltip } from "./ChartTooltip";

const CHART_RATIONALE: Record<string, string> = {
  "pt-BR": [
    "Scatter de departamentos por taxa de replanejamento (eixo X) vs deslocamento médio em dias (eixo Y).",
    "Tamanho da bolha = volume de auditorias. Cor: verde (≤10%), amarelo (10–30%), vermelho (crítico: >30% + >15d).",
    "Quadrantes delimitados em 10%/30% e 15 dias. Departamentos no quadrante \"Crítico\" requerem ação imediata.",
    "Histograma inferior mostra distribuição das faixas de deslocamento (antecipadas vs adiadas).",
    "Fonte: view auditorias_planejadas (MySQL), cálculo de delta entre PlannedDate e RealDate.",
  ].join(" "),
  "en-US": [
    "Department scatter by replanning rate (X axis) vs average displacement in days (Y axis).",
    "Bubble size = audit volume. Color: green (≤10%), yellow (10–30%), red (critical: >30% + >15d).",
    "Quadrants at 10%/30% and 15 days. Departments in \"Critical\" quadrant require immediate action.",
    "Bottom histogram shows displacement range distribution (anticipated vs delayed).",
    "Source: auditorias_planejadas view (MySQL), delta calculation between PlannedDate and RealDate.",
  ].join(" "),
};

type Props = BaseChartProps & {
  title: string;
  data: ReplanejamentoScatterChart;
};

const QUADRANT_LABELS = [
  { id: "low-low", label: "Baixo risco" },
  { id: "low-high", label: "Monitorar deslocamento" },
  { id: "high-low", label: "Frequência alta" },
  { id: "high-high", label: "Crítico" },
] as const;

const COLOR_LEGEND: Record<string, Record<string, string>> = {
  green: { "pt-BR": "Baixo (≤10%)", "en-US": "Low (≤10%)" },
  yellow: { "pt-BR": "Moderado (10–30%)", "en-US": "Moderate (10–30%)" },
  red: { "pt-BR": "Crítico (>30% + >15d)", "en-US": "Critical (>30% + >15d)" },
};

export function ReplanningChart({ title, data, labels, locale, onDrillDown }: Props) {
  const { tip, show, move, hide } = useChartTooltip();
  const { departments, histogram, insight_lead } = data;
  const lang = locale === "en-US" ? "en-US" : "pt-BR";

  if (departments.length === 0) {
    return (
      <section className="exec-chart-card" data-testid="chart-replanejamento">
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

  const width = 420;
  const scatterH = 220;
  const margin = { top: 24, right: 16, bottom: 32, left: 42 };

  const maxReplan = Math.max(50, ...departments.map((r) => r.replan_pct));
  const maxShift = Math.max(40, ...departments.map((r) => r.avg_displacement_days));

  const xScale = (v: number) =>
    margin.left + (v / maxReplan) * (width - margin.left - margin.right);
  const yScale = (v: number) =>
    margin.top + (1 - v / maxShift) * (scatterH - margin.top - margin.bottom);

  const maxHist = Math.max(1, ...histogram.map((b) => b.count));
  const histBarWidth = Math.min(40, (width - margin.left - margin.right) / Math.max(histogram.length, 1) - 6);
  const histHeight = 100;

  return (
    <section className="exec-chart-card" data-testid="chart-replanejamento">
      <h4 className="exec-chart-title" data-testid="chart-title">
        {title}
        <InfoTip content={CHART_RATIONALE[lang]} label={title} />
      </h4>
      <p className="exec-chart-insight" data-testid="insight-lead">{insightText}</p>

      <svg viewBox={`0 0 ${width} ${scatterH}`} className="chart-svg wide exec-chart-svg">
        {/* Quadrant guidelines */}
        <line data-testid="quadrant-axis-x-10"
          x1={xScale(10)} x2={xScale(10)} y1={margin.top} y2={scatterH - margin.bottom}
          stroke="#94a3b8" strokeDasharray="4 2" strokeWidth={0.8}
        />
        <line data-testid="quadrant-axis-x-30"
          x1={xScale(30)} x2={xScale(30)} y1={margin.top} y2={scatterH - margin.bottom}
          stroke="#94a3b8" strokeDasharray="4 2" strokeWidth={0.8}
        />
        <line data-testid="quadrant-axis-y-15"
          x1={margin.left} x2={width - margin.right} y1={yScale(15)} y2={yScale(15)}
          stroke="#94a3b8" strokeDasharray="4 2" strokeWidth={0.8}
        />

        {/* Quadrant labels */}
        {QUADRANT_LABELS.map((q, i) => {
          const lx = i % 2 === 0 ? xScale(5) : xScale(40);
          const ly = i < 2 ? yScale(maxShift * 0.9) : yScale(maxShift * 0.1);
          return (
            <text key={q.id} data-testid={`quadrant-label-${q.id}`}
              x={lx} y={ly} fontSize={8} fill="#64748b" textAnchor="middle"
            >
              {q.label}
            </text>
          );
        })}

        {/* Axis labels */}
        <text x={width / 2} y={scatterH - 4} textAnchor="middle" fontSize={8} fill="rgba(243,239,231,0.5)">
          {lang === "pt-BR" ? "% Replanejamento" : "% Replanning"}
        </text>
        <text x={10} y={scatterH / 2} textAnchor="middle" fontSize={8} fill="rgba(243,239,231,0.5)"
          transform={`rotate(-90, 10, ${scatterH / 2})`}
        >
          {lang === "pt-BR" ? "Deslocamento médio (dias)" : "Avg displacement (days)"}
        </text>

        {/* Department bubbles */}
        {departments.map((dept, i) => {
          const isCritical = dept.replan_pct > 30 && dept.avg_displacement_days > 15;
          const cx = xScale(dept.replan_pct);
          const cy = yScale(dept.avg_displacement_days);
          const radius = Math.max(5, Math.min(14, Math.sqrt(dept.volume) * 1.8));
          const testId = isCritical ? `scatter-point-critical-${i}` : `scatter-point-${i}`;
          const fill = isCritical ? "#ef4444" : dept.replan_pct > 10 ? "#eab308" : "#22c55e";

          const tipText = [
            dept.name,
            `${labels.scatterAnticipated}: ${dept.anticipated_pct.toFixed(1)}%`,
            `${labels.scatterDelayed}: ${dept.postponed_pct.toFixed(1)}%`,
            `Volume: ${dept.volume}`,
            `${lang === "pt-BR" ? "Deslocamento" : "Displacement"}: ${dept.avg_displacement_days.toFixed(1)}d`,
          ].join(" | ");

          return (
            <g key={dept.name + i}>
              <circle
                data-testid={testId}
                data-dept-label={isCritical ? dept.name : undefined}
                cx={cx} cy={cy} r={radius}
                fill={fill} fillOpacity={0.7}
                stroke="#1e293b" strokeWidth={1}
                style={{ cursor: "pointer" }}
                onClick={() => onDrillDown?.({ field: "department", value: dept.name })}
                onMouseEnter={(e) => show(tipText, e)}
                onMouseMove={move}
                onMouseLeave={hide}
              />
              {isCritical ? (
                <text x={cx} y={cy - radius - 3} textAnchor="middle" fontSize={8} fill="#ef4444">
                  {dept.name}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Histogram */}
      <p className="exec-chart-sub-title">{lang === "pt-BR" ? "Distribuição de deslocamento" : "Displacement distribution"}</p>
      <div data-testid="replan-histogram">
        <svg viewBox={`0 0 ${width} ${histHeight}`} className="chart-svg wide exec-chart-svg">
          {histogram.map((bin, i) => {
            const barH = (bin.count / maxHist) * (histHeight - 32);
            const x = margin.left + i * (histBarWidth + 6);
            const fill = bin.range === "anticipated" ? "#22c55e" : "#64748b";
            const tipText = `${bin.range}: ${bin.count}`;
            return (
              <g key={bin.range}>
                <rect
                  data-testid={`histogram-bar-${bin.range}`}
                  data-range={bin.range}
                  x={x} y={histHeight - 20 - barH}
                  width={histBarWidth} height={barH}
                  fill={fill} rx={2}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => show(tipText, e)}
                  onMouseMove={move}
                  onMouseLeave={hide}
                />
                <text x={x + histBarWidth / 2} y={histHeight - 6} textAnchor="middle" fontSize={7} fill="#94a3b8">
                  {bin.range}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="exec-chart-legend">
        <span className="exec-legend-item">
          <span className="exec-legend-swatch" style={{ background: "#22c55e" }} />
          {COLOR_LEGEND.green[lang]}
        </span>
        <span className="exec-legend-item">
          <span className="exec-legend-swatch" style={{ background: "#eab308" }} />
          {COLOR_LEGEND.yellow[lang]}
        </span>
        <span className="exec-legend-item">
          <span className="exec-legend-swatch" style={{ background: "#ef4444" }} />
          {COLOR_LEGEND.red[lang]}
        </span>
        <span className="exec-legend-item exec-legend-note">
          {lang === "pt-BR" ? "Tamanho = volume de auditorias" : "Size = audit volume"}
        </span>
      </div>

      <ChartTooltip content={tip?.content ?? null} x={tip?.x} y={tip?.y} />
    </section>
  );
}
