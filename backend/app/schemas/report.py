from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class ReportCatalogItem(BaseModel):
    report_id: str
    title: str
    sql_file_name: str
    status: Literal["available", "blocked_by_permissions", "query_error"]
    blocked_reason: str | None = None


class ReportCatalogResponse(BaseModel):
    reports: list[ReportCatalogItem]


class ReportResponse(BaseModel):
    report_id: str
    title: str
    limit: int = Field(ge=1, le=500)
    offset: int = Field(ge=0)
    row_count: int = Field(ge=0)
    rows: list[dict[str, Any]]


Severity = Literal["green", "yellow", "red", "neutral"]


class KpiItem(BaseModel):
    """Single KPI card payload (4-KPI executive set — ordem CEO #18)."""

    model_config = ConfigDict(extra="forbid")

    id: str
    severity: Severity
    value_percent: float | None = None
    value_count: int | None = None
    numerator: int | None = None
    denominator: int | None = None
    thresholds: dict[str, int] | None = None
    unassigned_owner_count: int | None = None
    iatf_unassigned_flag: bool | None = None


class AuditoriasPlanejadasKpisResponse(BaseModel):
    report_id: str
    reference_date: str
    period_start: str
    period_end: str
    kpis: list[KpiItem]


class InsightLead(BaseModel):
    severity: Severity
    text: str


class AderenciaMensalBucket(BaseModel):
    month: str
    on_time: int
    within_30d: int
    over_30d: int
    overdue: int
    adherence_pct: float | None


class AderenciaMensalChart(BaseModel):
    buckets: list[AderenciaMensalBucket]
    target_pct: float
    insight_lead: InsightLead


class ScatterDepartment(BaseModel):
    name: str
    replan_pct: float
    avg_displacement_days: float
    volume: int
    quadrant: str
    anticipated_pct: float
    postponed_pct: float


class HistogramBin(BaseModel):
    range: str
    count: int


class ReplanejamentoScatterChart(BaseModel):
    departments: list[ScatterDepartment]
    histogram: list[HistogramBin]
    insight_lead: InsightLead


class HeatmapCell(BaseModel):
    sector: str
    audit_type: str
    count: int
    adherence_pct: float | None
    sample_sufficient: bool


class HeatmapSetorTipoChart(BaseModel):
    period_months: int
    cells: list[HeatmapCell]
    insight_lead: InsightLead


class FunilStage(BaseModel):
    id: str
    count: int
    label: str
    conversion_pct: float | None = None


class FunilAnnotation(BaseModel):
    replanned_count: int
    out_of_tolerance_count: int


class FunilExecucaoChart(BaseModel):
    stages: list[FunilStage]
    annotation: FunilAnnotation
    insight_lead: InsightLead


class ChartsPayload(BaseModel):
    aderencia_mensal: AderenciaMensalChart = Field(alias="aderencia-mensal")
    replanejamento_scatter: ReplanejamentoScatterChart = Field(alias="replanejamento-scatter")
    heatmap_setor_tipo: HeatmapSetorTipoChart = Field(alias="heatmap-setor-tipo")
    funil_execucao: FunilExecucaoChart = Field(alias="funil-execucao")

    model_config = ConfigDict(populate_by_name=True)


class AuditoriasPlanejadasChartsResponse(BaseModel):
    report_id: str
    reference_date: str
    period_start: str
    period_end: str
    charts: ChartsPayload
