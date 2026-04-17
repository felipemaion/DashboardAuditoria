import { InfoTip } from "../InfoTip";
import type { BaseChartProps, FunilExecucaoChart } from "./types";
import { ChartTooltip, useChartTooltip } from "./ChartTooltip";

const CHART_RATIONALE: Record<string, string> = {
  "pt-BR": [
    "Funil progressivo do programa de auditorias: planejadas → replanejadas → realizadas (≤30d) → score VDA ≥70.",
    "Cada etapa filtra o universo anterior. A conversão % mostra a taxa de passagem entre estágios.",
    "Score VDA: A ≥ 90 (excelente), AB: 80–89, B: 70–79 (aceitável), C < 60 (crítico).",
    "Fonte: views auditorias_planejadas × auditorias_realizadas (MySQL). Tolerância de 30 dias para \"realizada\".",
    "Auditorias fora da tolerância de 30 dias não contam como realizadas neste funil.",
  ].join(" "),
  "en-US": [
    "Progressive audit program funnel: planned → rescheduled → executed (≤30d) → VDA score ≥70.",
    "Each stage filters the previous universe. Conversion % shows pass-through rate between stages.",
    "VDA Score: A ≥ 90 (excellent), AB: 80–89, B: 70–79 (acceptable), C < 60 (critical).",
    "Source: auditorias_planejadas × auditorias_realizadas views (MySQL). 30-day tolerance for \"executed\".",
    "Audits outside the 30-day tolerance do not count as executed in this funnel.",
  ].join(" "),
};

type Props = BaseChartProps & {
  title: string;
  data: FunilExecucaoChart;
};

const STAGE_COLORS: Record<string, string> = {
  planejadas: "#3b82f6",
  replanejadas: "#eab308",
  "realizadas-30d": "#22c55e",
  "score-gte-70": "#10b981",
};

const VDA_SCALE_TEXT = "A ≥ 90 | AB: 80–89 | B: 70–79 | C < 60";

const STAGE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  planejadas: {
    "pt-BR": "Total de auditorias planejadas no período",
    "en-US": "Total planned audits in the period",
  },
  replanejadas: {
    "pt-BR": "Auditorias que tiveram data replanejada antes da execução",
    "en-US": "Audits rescheduled before execution",
  },
  "realizadas-30d": {
    "pt-BR": "Executadas dentro da tolerância de 30 dias da data planejada",
    "en-US": "Executed within 30-day tolerance of planned date",
  },
  "score-gte-70": {
    "pt-BR": "Score VDA ≥ 70 (classificação B ou superior). " + VDA_SCALE_TEXT,
    "en-US": "VDA score ≥ 70 (grade B or above). " + VDA_SCALE_TEXT,
  },
};

export function ExecutionFunnel({ title, data, labels, locale, onDrillDown }: Props) {
  const { tip, show, move, hide } = useChartTooltip();
  const { stages, annotation, insight_lead } = data;
  const lang = locale === "en-US" ? "en-US" : "pt-BR";

  if (stages.length === 0) {
    return (
      <section className="exec-chart-card" data-testid="chart-funil">
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
  const maxCount = Math.max(1, ...stages.map((s) => s.count));
  const width = 420;
  const rowHeight = 30;
  const gap = 6;
  const marginLeft = 8;
  const barMaxWidth = width - marginLeft - 90;
  const height = stages.length * (rowHeight + gap) + 40;

  return (
    <section className="exec-chart-card" data-testid="chart-funil">
      <h4 className="exec-chart-title" data-testid="chart-title">
        {title}
        <InfoTip content={CHART_RATIONALE[lang]} label={title} />
      </h4>
      <p className="exec-chart-insight" data-testid="insight-lead">{insightText}</p>

      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg wide exec-chart-svg">
        {stages.map((stage, i) => {
          const barW = Math.max(24, (stage.count / maxCount) * barMaxWidth);
          const y = i * (rowHeight + gap) + 8;
          const stageKey = stage.id;
          const fill = STAGE_COLORS[stageKey] ?? "#64748b";
          const stageLabel = stage.label;
          const convPct = stage.conversion_pct != null ? ` (${stage.conversion_pct.toFixed(1)}%)` : "";
          const desc = STAGE_DESCRIPTIONS[stageKey]?.[lang] ?? stageLabel;
          const tipText = `${stageLabel}: ${stage.count}${convPct} — ${desc}`;

          return (
            <g
              key={stageKey}
              data-testid={`funnel-bar-${stageKey}`}
              data-stage={stageKey}
              style={{ cursor: "pointer" }}
              onClick={() => onDrillDown?.({ field: "stage", value: stageKey })}
              onMouseEnter={(e) => show(tipText, e)}
              onMouseMove={move}
              onMouseLeave={hide}
            >
              <rect x={marginLeft} y={y} width={barW} height={rowHeight} rx={4} fill={fill} />
              <text x={marginLeft + barW + 6} y={y + rowHeight / 2 + 4} fontSize={10} fill="#f8fafc">
                {stageLabel} ({stage.count})
              </text>
            </g>
          );
        })}
      </svg>

      <div data-testid="funnel-annotation-replanned" className="funnel-annotation">
        {labels.funnelReplannedAnnotation} ({annotation.replanned_count} replanejada{annotation.replanned_count !== 1 ? "s" : ""})
      </div>
      <p data-testid="funnel-footnote" className="chart-footnote">
        {labels.funnelFootnote}
      </p>

      {/* Legend */}
      <div className="exec-chart-legend">
        {stages.map((stage) => (
          <span key={stage.id} className="exec-legend-item">
            <span className="exec-legend-swatch" style={{ background: STAGE_COLORS[stage.id] ?? "#64748b" }} />
            {stage.label}
          </span>
        ))}
      </div>

      <ChartTooltip content={tip?.content ?? null} x={tip?.x} y={tip?.y} />
    </section>
  );
}
