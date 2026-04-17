import type { Locale } from "../../lib/i18n";

// ---------------------------------------------------------------------------
// Backend contract types (mirrors backend/app/schemas/report.py)
// ---------------------------------------------------------------------------

export type Severity = "green" | "yellow" | "red" | "neutral";

export type InsightLead = {
  severity: Severity;
  text: string;
};

export type AderenciaMensalBucket = {
  month: string;
  on_time: number;
  within_30d: number;
  over_30d: number;
  overdue: number;
  adherence_pct: number | null;
};

export type AderenciaMensalChart = {
  buckets: AderenciaMensalBucket[];
  target_pct: number;
  insight_lead: InsightLead;
};

export type ScatterDepartment = {
  name: string;
  replan_pct: number;
  avg_displacement_days: number;
  volume: number;
  quadrant: string;
  anticipated_pct: number;
  postponed_pct: number;
};

export type HistogramBin = {
  range: string;
  count: number;
};

export type ReplanejamentoScatterChart = {
  departments: ScatterDepartment[];
  histogram: HistogramBin[];
  insight_lead: InsightLead;
};

export type HeatmapCell = {
  sector: string;
  audit_type: string;
  count: number;
  adherence_pct: number | null;
  sample_sufficient: boolean;
};

export type HeatmapSetorTipoChart = {
  period_months: number;
  cells: HeatmapCell[];
  insight_lead: InsightLead;
};

export type FunilStage = {
  id: string;
  count: number;
  label: string;
  conversion_pct: number | null;
};

export type FunilAnnotation = {
  replanned_count: number;
  out_of_tolerance_count: number;
};

export type FunilExecucaoChart = {
  stages: FunilStage[];
  annotation: FunilAnnotation;
  insight_lead: InsightLead;
};

export type ChartsPayload = {
  "aderencia-mensal": AderenciaMensalChart;
  "replanejamento-scatter": ReplanejamentoScatterChart;
  "heatmap-setor-tipo": HeatmapSetorTipoChart;
  "funil-execucao": FunilExecucaoChart;
};

export type ChartsResponse = {
  report_id: string;
  reference_date: string;
  period_start: string;
  period_end: string;
  charts: ChartsPayload;
};

// ---------------------------------------------------------------------------
// Shared component types
// ---------------------------------------------------------------------------

export type ChartDrillDown = (filter: { field: string; value: string }) => void;

export type ChartLabels = {
  chartEmptyState: string;
  chartEmptyHint: string;
  chartInsightDefault: string;
  heatmapToggle12m: string;
  heatmapToggle3y: string;
  heatmapSmallSample: string;
  heatmapAdherenceLabel: string;
  heatmapGapLabel: string;
  heatmapFilterSector: string;
  heatmapFilterType: string;
  heatmapFilterAll: string;
  heatmapFilterClear: string;
  heatmapZoomIn: string;
  heatmapZoomOut: string;
  heatmapZoomReset: string;
  heatmapSelectPrompt: string;
  heatmapShowAll: string;
  funnelFootnote: string;
  funnelReplannedAnnotation: string;
  funnelVdaScoreLabel: string;
  scatterAnticipated: string;
  scatterDelayed: string;
};

export type BaseChartProps = {
  locale: Locale;
  labels: ChartLabels;
  onDrillDown?: ChartDrillDown;
  compact?: boolean;
};
