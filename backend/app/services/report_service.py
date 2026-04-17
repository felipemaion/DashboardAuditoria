from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from math import isnan
from pathlib import Path
from typing import Any, Literal, TypedDict

from pymysql.err import OperationalError

from backend.app.repositories.report_repository import fetch_report_rows, fetch_rows

# Sensitive PII fields that must never reach the frontend regardless of SQL origin.
SENSITIVE_FIELDS_DENYLIST: frozenset[str] = frozenset(
    {
        "ResponsibleDocumentNumber",
        "ResponsibleDocumentType",
        "AuditorDocumentNumber",
        "AuditorDocumentType",
    }
)

# Legacy aliases with broken casing that were corrected in SQL. Strip them from
# any payload so that downstream consumers never receive the old names.
TYPO_ALIAS_DENYLIST: frozenset[str] = frozenset(
    {
        "auditAuditorPerSOnName",
        "auditSECtorDescription",
        "auditLevelDescriPTion",
    }
)

FIELDS_TO_STRIP: frozenset[str] = SENSITIVE_FIELDS_DENYLIST | TYPO_ALIAS_DENYLIST


@dataclass(frozen=True)
class ReportDefinition:
    report_id: str
    title: str
    sql_file: Path


@dataclass(frozen=True)
class ReportStatus:
    status: Literal["available", "blocked_by_permissions", "query_error"]
    blocked_reason: str | None


class ReportCatalogEntry(TypedDict):
    report_id: str
    title: str
    sql_file_name: str
    status: Literal["available", "blocked_by_permissions", "query_error"]
    blocked_reason: str | None


PROJECT_ROOT = Path(__file__).resolve().parents[3]
REPORT_SQL_DIRECTORY = PROJECT_ROOT / "database" / "views" / "mysql"

REPORT_DEFINITIONS = {
    "atividades-completas": ReportDefinition(
        report_id="atividades-completas",
        title="Atividades Completas",
        sql_file=REPORT_SQL_DIRECTORY / "atividades_completas.sql",
    ),
    "atividades-de-auditoria": ReportDefinition(
        report_id="atividades-de-auditoria",
        title="Atividades de Auditoria",
        sql_file=REPORT_SQL_DIRECTORY / "atividades_de_auditoria.sql",
    ),
    "auditorias-planejadas": ReportDefinition(
        report_id="auditorias-planejadas",
        title="Auditorias Planejadas",
        sql_file=REPORT_SQL_DIRECTORY / "auditorias_planejadas.sql",
    ),
    "auditorias-realizadas": ReportDefinition(
        report_id="auditorias-realizadas",
        title="Auditorias Realizadas",
        sql_file=REPORT_SQL_DIRECTORY / "auditorias_realizadas.sql",
    ),
    "nao-conformidade": ReportDefinition(
        report_id="nao-conformidade",
        title="Nao Conformidade",
        sql_file=REPORT_SQL_DIRECTORY / "nao_conformidade.sql",
    ),
    "ocorrencias-com-e-sem-atividade": ReportDefinition(
        report_id="ocorrencias-com-e-sem-atividade",
        title="Ocorrencias com e sem Atividade",
        sql_file=REPORT_SQL_DIRECTORY / "ocorrencias_com_e_sem_atividade.sql",
    ),
    "ocorrencias-com-indicador": ReportDefinition(
        report_id="ocorrencias-com-indicador",
        title="Ocorrencias com Indicador",
        sql_file=REPORT_SQL_DIRECTORY / "ocorrencias_com_indicador.sql",
    ),
    "ocorrencias-ff": ReportDefinition(
        report_id="ocorrencias-ff",
        title="Ocorrencias FF",
        sql_file=REPORT_SQL_DIRECTORY / "ocorrencias_ff.sql",
    ),
}


def get_report_definition(report_id: str) -> ReportDefinition:
    return REPORT_DEFINITIONS[report_id]


def list_report_definitions() -> list[ReportDefinition]:
    return [REPORT_DEFINITIONS[report_id] for report_id in sorted(REPORT_DEFINITIONS)]


def probe_report_definition(report_definition: ReportDefinition) -> ReportStatus:
    try:
        base_query = load_report_sql(report_definition)
        paginated_query = build_paginated_report_query(base_query)
        fetch_report_rows(paginated_query, limit=1, offset=0)
    except OperationalError as error:
        if error.args and error.args[0] == 1142:
            return ReportStatus(
                status="blocked_by_permissions",
                blocked_reason="Access denied",
            )
        return ReportStatus(status="query_error", blocked_reason="Query execution error")
    except Exception:
        return ReportStatus(status="query_error", blocked_reason="Query execution error")

    return ReportStatus(status="available", blocked_reason=None)


def get_report_catalog(report_definitions: list[ReportDefinition]) -> list[ReportCatalogEntry]:
    catalog: list[ReportCatalogEntry] = []

    for report_definition in report_definitions:
        report_status = probe_report_definition(report_definition)
        catalog.append(
            {
                "report_id": report_definition.report_id,
                "title": report_definition.title,
                "sql_file_name": report_definition.sql_file.name,
                "status": report_status.status,
                "blocked_reason": report_status.blocked_reason,
            }
        )

    return catalog


def build_paginated_report_query(base_query: str) -> str:
    normalized_query = base_query.strip().rstrip(";").replace("%", "%%")
    return f"SELECT * FROM ({normalized_query}) AS report_rows LIMIT %s OFFSET %s"  # noqa: S608  # nosec B608


def load_report_sql(report_definition: ReportDefinition) -> str:
    return report_definition.sql_file.read_text(encoding="utf-8")


def run_report(report_id: str, *, limit: int, offset: int) -> dict[str, Any]:
    report_definition = get_report_definition(report_id)
    base_query = load_report_sql(report_definition)
    paginated_query = build_paginated_report_query(base_query)
    rows = fetch_report_rows(paginated_query, limit=limit, offset=offset)

    return {
        "report_id": report_definition.report_id,
        "title": report_definition.title,
        "limit": limit,
        "offset": offset,
        "row_count": len(rows),
        "rows": rows,
    }


def sanitize_report_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Strip sensitive PII fields and broken legacy aliases from every row.

    This is the last line of defence before data leaves the service layer.
    Even if an upstream SQL change or join accidentally reintroduces a
    forbidden field, this function ensures it never reaches the frontend.
    """
    if not FIELDS_TO_STRIP:
        return rows
    return [{k: v for k, v in row.items() if k not in FIELDS_TO_STRIP} for row in rows]


# ---------------------------------------------------------------------------
# KPIs executivos — auditorias-planejadas (4 cards, ordem CEO #18)
# ---------------------------------------------------------------------------

AUDITS_KPI_BASE_SQL_FILE: Path = REPORT_SQL_DIRECTORY / "audits_kpi_base.sql"
AUDITS_KPI_BASE_BY_SECTOR_SQL_FILE: Path = REPORT_SQL_DIRECTORY / "audits_kpi_base_by_sector.sql"
TOLERANCE_DAYS: int = 30
PROXIMAS_HORIZON_DAYS: int = 30


def fetch_audits_kpi_base_rows() -> list[dict[str, Any]]:
    """Read the audits_kpi_base view and return every row (no pagination).

    The view already encapsulates soft-delete filters and the Audit_Status = 3
    join. Period and reference-date filters are applied by the compute layer
    so that all KPIs share the same row universe.
    """
    base_query = AUDITS_KPI_BASE_SQL_FILE.read_text(encoding="utf-8").strip().rstrip(";")
    wrapped_query = f"SELECT * FROM ({base_query}) AS kpi_base"  # noqa: S608  # nosec B608
    return fetch_rows(wrapped_query)


_SENTINEL_DATE_STR = "1000-01-01"


def _parse_iso_date(value: Any) -> date | None:
    if value is None:
        return None
    raw = str(value)[:10]
    if raw == _SENTINEL_DATE_STR:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(raw)
    except ValueError:
        return None


def _effective_date(row: dict[str, Any]) -> date | None:
    replanned = _parse_iso_date(row.get("ReplannedDate"))
    if replanned is not None:
        return replanned
    return _parse_iso_date(row.get("PlannedDate"))


def _is_replanned(row: dict[str, Any]) -> bool:
    replanned = _parse_iso_date(row.get("ReplannedDate"))
    planned = _parse_iso_date(row.get("PlannedDate"))
    return replanned is not None and replanned != planned


def _executed_within_tolerance(row: dict[str, Any]) -> bool:
    executed = _parse_iso_date(row.get("ExecutedAt"))
    effective = _effective_date(row)
    if executed is None or effective is None:
        return False
    return executed <= effective + timedelta(days=TOLERANCE_DAYS)


def _has_execution(row: dict[str, Any]) -> bool:
    return _parse_iso_date(row.get("ExecutedAt")) is not None


SeverityLevel = Literal["green", "yellow", "red", "neutral"]


def _severity_aderencia(value_percent: float | None) -> SeverityLevel:
    if value_percent is None:
        return "neutral"
    if value_percent >= 95:
        return "green"
    if value_percent >= 85:
        return "yellow"
    return "red"


def _severity_replanejamento(value_percent: float | None) -> SeverityLevel:
    if value_percent is None:
        return "neutral"
    if value_percent <= 10:
        return "green"
    if value_percent <= 30:
        return "yellow"
    return "red"


def _severity_vencidas(value_percent: float | None) -> SeverityLevel:
    if value_percent is None:
        return "neutral"
    if value_percent <= 2:
        return "green"
    if value_percent <= 5:
        return "yellow"
    return "red"


def _distinct_active_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Keep the first occurrence of each AuditingPlanningCode and skip soft-deleted rows.

    The audits_kpi_base view already applies TupleExcluded = 0, but we re-check
    defensively because this function may receive rows from tests or ad-hoc
    callers that did not pass through the view.
    """
    seen: dict[int, dict[str, Any]] = {}
    for row in rows:
        code = row.get("AuditingPlanningCode")
        if code is None:
            continue
        if int(row.get("TupleExcluded") or 0) != 0:
            continue
        if code not in seen:
            seen[code] = row
    return list(seen.values())


def compute_auditorias_planejadas_kpis(
    rows: list[dict[str, Any]],
    *,
    reference_date: date,
    period_start: date,
    period_end: date,
) -> dict[str, Any]:
    """Pure computation of the 4 executive KPIs for auditorias-planejadas.

    Input ``rows`` follows the ``audits_kpi_base`` view grain (one row per
    AuditingPlanningCode with ExecutedAt already joined when Audit_Status = 3).
    Thresholds and severity colours are frozen by CEO #18.
    """
    active_rows = _distinct_active_rows(rows)

    within_period_due = [
        row
        for row in active_rows
        if (effective := _effective_date(row)) is not None
        and period_start <= effective <= period_end
        and effective <= reference_date
    ]
    denom_aderencia = len(within_period_due)
    num_aderencia = sum(
        1 for row in within_period_due if _has_execution(row) and _executed_within_tolerance(row)
    )
    percent_aderencia = (num_aderencia / denom_aderencia) * 100.0 if denom_aderencia > 0 else None

    within_period_planned = [
        row
        for row in active_rows
        if (planned := _parse_iso_date(row.get("PlannedDate"))) is not None
        and period_start <= planned <= period_end
    ]
    denom_replan = len(within_period_planned)
    num_replan = sum(1 for row in within_period_planned if _is_replanned(row))
    percent_replan = (num_replan / denom_replan) * 100.0 if denom_replan > 0 else None

    vencidas_count = sum(
        1
        for row in within_period_due
        if (effective := _effective_date(row)) is not None
        and effective < reference_date
        and (not _has_execution(row) or not _executed_within_tolerance(row))
    )
    percent_vencidas = (vencidas_count / denom_aderencia) * 100.0 if denom_aderencia > 0 else None

    horizon_date = reference_date + timedelta(days=PROXIMAS_HORIZON_DAYS)
    proximas_rows = [
        row
        for row in active_rows
        if (effective := _effective_date(row)) is not None
        and reference_date <= effective <= horizon_date
        and not _has_execution(row)
    ]
    unassigned_owner_count = sum(1 for row in proximas_rows if row.get("ResponsibleCode") is None)

    return {
        "report_id": "auditorias-planejadas",
        "reference_date": reference_date.isoformat(),
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "kpis": [
            {
                "id": "aderencia-plano",
                "value_percent": percent_aderencia,
                "numerator": num_aderencia,
                "denominator": denom_aderencia,
                "severity": _severity_aderencia(percent_aderencia),
                "thresholds": {"green_min": 95, "yellow_min": 85},
            },
            {
                "id": "replanejamento",
                "value_percent": percent_replan,
                "numerator": num_replan,
                "denominator": denom_replan,
                "severity": _severity_replanejamento(percent_replan),
                "thresholds": {"green_max": 10, "yellow_max": 30},
            },
            {
                "id": "auditorias-vencidas",
                "value_percent": percent_vencidas,
                "value_count": vencidas_count,
                "denominator": denom_aderencia,
                "severity": _severity_vencidas(percent_vencidas),
                "thresholds": {"green_max": 2, "yellow_max": 5},
            },
            {
                "id": "proximas-30-dias",
                "value_count": len(proximas_rows),
                "unassigned_owner_count": unassigned_owner_count,
                "iatf_unassigned_flag": unassigned_owner_count > 0,
                "severity": "neutral",
                "thresholds": None,
            },
        ],
    }


# ---------------------------------------------------------------------------
# Charts executivos — auditorias-planejadas (4 gráficos, Fase C)
# ---------------------------------------------------------------------------

ADERENCIA_TARGET_PCT = 95.0
REPLAN_LOW_THRESHOLD = 10.0
REPLAN_HIGH_THRESHOLD = 30.0
DISPLACEMENT_DAY_THRESHOLD = 15.0
HEATMAP_MIN_SAMPLE = 5
FUNIL_SCORE_THRESHOLD = 70.0

_HISTOGRAM_BINS: list[tuple[str, int, int]] = [
    ("0-7", 0, 7),
    ("8-15", 8, 15),
    ("16-30", 16, 30),
    ("31-60", 31, 60),
    ("61+", 61, 999_999),
]


def fetch_audits_kpi_base_by_sector_rows() -> list[dict[str, Any]]:
    base = AUDITS_KPI_BASE_BY_SECTOR_SQL_FILE.read_text(encoding="utf-8").strip().rstrip(";")
    query = f"SELECT * FROM ({base}) AS kpi_sector"  # noqa: S608  # nosec B608
    return fetch_rows(query)


def _classify_execution(
    row: dict[str, Any],
    reference_date: date,
) -> str | None:
    """Classify row into one of 4 stacked-bar categories for P1."""
    effective = _effective_date(row)
    if effective is None:
        return None
    executed = _parse_iso_date(row.get("ExecutedAt"))
    if executed is not None:
        if executed <= effective:
            return "on_time"
        if _executed_within_tolerance(row):
            return "within_30d"
        return "over_30d"
    if effective < reference_date:
        return "overdue"
    return None


def _safe_pct(numerator: int | float, denominator: int | float) -> float | None:
    if denominator == 0:
        return None
    result = numerator / denominator * 100.0
    return result


def _compute_aderencia_mensal(
    active_rows: list[dict[str, Any]],
    reference_date: date,
    period_start: date,
    period_end: date,
) -> dict[str, Any]:
    """P1: monthly adherence stacked bar."""
    buckets: dict[str, dict[str, int]] = defaultdict(
        lambda: {"on_time": 0, "within_30d": 0, "over_30d": 0, "overdue": 0}
    )

    for row in active_rows:
        effective = _effective_date(row)
        if effective is None:
            continue
        if not (period_start <= effective <= period_end):
            continue
        category = _classify_execution(row, reference_date)
        if category is None:
            continue
        month_key = effective.strftime("%Y-%m")
        buckets[month_key][category] += 1

    result_buckets: list[dict[str, Any]] = []
    for month in sorted(buckets):
        b = buckets[month]
        total = b["on_time"] + b["within_30d"] + b["over_30d"] + b["overdue"]
        adherent = b["on_time"] + b["within_30d"]
        result_buckets.append(
            {
                "month": month,
                "on_time": b["on_time"],
                "within_30d": b["within_30d"],
                "over_30d": b["over_30d"],
                "overdue": b["overdue"],
                "adherence_pct": _safe_pct(adherent, total),
            }
        )

    low_months = sum(
        1 for b in result_buckets if b["adherence_pct"] is not None and b["adherence_pct"] < 85
    )
    if low_months >= 3:
        insight = {
            "severity": "red",
            "text": (
                f"Aderência abaixo de 85% há {low_months} meses consecutivos. "
                "Investigar causas sistêmicas de atraso."
            ),
        }
    elif low_months >= 1:
        insight = {
            "severity": "yellow",
            "text": (f"{low_months} mês(es) com aderência abaixo de 85%. Monitorar tendência."),
        }
    else:
        insight = {
            "severity": "green",
            "text": "Aderência dentro da meta em todos os meses do período.",
        }

    return {
        "buckets": result_buckets,
        "target_pct": ADERENCIA_TARGET_PCT,
        "insight_lead": insight,
    }


def _compute_replanejamento_scatter(
    active_rows: list[dict[str, Any]],
    period_start: date,
    period_end: date,
) -> dict[str, Any]:
    """P2: department scatter + displacement histogram."""
    dept_rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in active_rows:
        planned = _parse_iso_date(row.get("PlannedDate"))
        if planned is None or not (period_start <= planned <= period_end):
            continue
        dept = row.get("DepartmentDescription") or "Sem Departamento"
        dept_rows[dept].append(row)

    global_displacements: list[int] = []
    departments: list[dict[str, Any]] = []

    for dept_name in sorted(dept_rows):
        rows = dept_rows[dept_name]
        volume = len(rows)
        replanned = [r for r in rows if _is_replanned(r)]
        replan_count = len(replanned)
        replan_pct = (replan_count / volume) * 100.0 if volume else 0.0

        postponed: list[int] = []
        anticipated_count = 0
        for r in replanned:
            planned_d = _parse_iso_date(r.get("PlannedDate"))
            replanned_d = _parse_iso_date(r.get("ReplannedDate"))
            if planned_d is None or replanned_d is None:
                continue
            delta = (replanned_d - planned_d).days
            if delta < 0:
                anticipated_count += 1
                global_displacements.append(delta)
            else:
                postponed.append(delta)
                global_displacements.append(delta)

        postponed_pct = (len(postponed) / volume) * 100.0 if volume else 0.0
        anticipated_pct = (anticipated_count / volume) * 100.0 if volume else 0.0
        avg_disp = sum(postponed) / len(postponed) if postponed else 0.0

        if replan_pct > REPLAN_HIGH_THRESHOLD:
            quadrant = "critical"
        elif replan_pct > REPLAN_LOW_THRESHOLD:
            quadrant = "attention" if avg_disp > DISPLACEMENT_DAY_THRESHOLD else "moderate"
        else:
            quadrant = "watch" if avg_disp > DISPLACEMENT_DAY_THRESHOLD else "optimal"

        departments.append(
            {
                "name": dept_name,
                "replan_pct": round(replan_pct, 1),
                "avg_displacement_days": round(avg_disp, 1),
                "volume": volume,
                "quadrant": quadrant,
                "anticipated_pct": round(anticipated_pct, 1),
                "postponed_pct": round(postponed_pct, 1),
            }
        )

    histogram: list[dict[str, Any]] = []
    positive_displacements = [d for d in global_displacements if d >= 0]
    for bin_label, lo, hi in _HISTOGRAM_BINS:
        count = sum(1 for d in positive_displacements if lo <= d <= hi)
        histogram.append({"range": bin_label, "count": count})
    anticipated_total = sum(1 for d in global_displacements if d < 0)
    histogram.append({"range": "anticipated", "count": anticipated_total})

    critical_depts = [d for d in departments if d["quadrant"] == "critical"]
    if critical_depts:
        names = ", ".join(d["name"] for d in critical_depts[:3])
        insight: dict[str, str] = {
            "severity": "red",
            "text": (
                f"Departamentos em zona crítica de replanejamento: {names}. "
                "Avaliar capacidade e realismo do planejamento."
            ),
        }
    elif any(d["quadrant"] in ("attention", "moderate") for d in departments):
        insight = {
            "severity": "yellow",
            "text": (
                "Alguns departamentos com taxa de replanejamento moderada. Acompanhar evolução."
            ),
        }
    else:
        insight = {
            "severity": "green",
            "text": "Replanejamento sob controle em todos os departamentos.",
        }

    return {
        "departments": departments,
        "histogram": histogram,
        "insight_lead": insight,
    }


def _compute_heatmap_setor_tipo(
    by_sector_rows: list[dict[str, Any]],
    reference_date: date,
    period_months: int,
) -> dict[str, Any]:
    """P3: sector × audit-type heatmap."""
    cutoff = (
        date(
            reference_date.year - (period_months // 12),
            reference_date.month - (period_months % 12) or 12,
            1,
        )
        if period_months < 12
        else date(
            reference_date.year - (period_months // 12),
            reference_date.month,
            1,
        )
    )
    try:
        cutoff = date(
            reference_date.year,
            reference_date.month,
            1,
        ) - timedelta(days=period_months * 30)
    except ValueError:
        cutoff = date(reference_date.year - 1, reference_date.month, 1)

    cells_data: dict[tuple[str, str], dict[str, int]] = defaultdict(
        lambda: {"count": 0, "adherent": 0}
    )

    seen_plans: set[tuple[str, str, int]] = set()

    for row in by_sector_rows:
        effective = _effective_date(row)
        if effective is None or effective < cutoff or effective > reference_date:
            continue
        sector = row.get("SectorDescription") or "Sem Setor"
        audit_type = row.get("TypeAuditDescription") or "Sem Tipo"
        code = row.get("AuditingPlanningCode")
        if code is None:
            continue
        key = (sector, audit_type, code)
        if key in seen_plans:
            continue
        seen_plans.add(key)

        cell_key = (sector, audit_type)
        cells_data[cell_key]["count"] += 1
        if _has_execution(row) and _executed_within_tolerance(row):
            cells_data[cell_key]["adherent"] += 1

    cells: list[dict[str, Any]] = []
    for (sector, audit_type), data in sorted(cells_data.items()):
        count = data["count"]
        sufficient = count >= HEATMAP_MIN_SAMPLE
        cells.append(
            {
                "sector": sector,
                "audit_type": audit_type,
                "count": count,
                "adherence_pct": (_safe_pct(data["adherent"], count) if sufficient else None),
                "sample_sufficient": sufficient,
            }
        )

    low_cells = [c for c in cells if c["adherence_pct"] is not None and c["adherence_pct"] < 70]
    if low_cells:
        worst = min(low_cells, key=lambda c: c["adherence_pct"] or 0)
        insight: dict[str, str] = {
            "severity": "red",
            "text": (
                f"Combinação {worst['sector']} × {worst['audit_type']} "
                f"com aderência de {worst['adherence_pct']:.0f}%. "
                "Priorizar ações corretivas."
            ),
        }
    else:
        insight = {
            "severity": "green",
            "text": "Nenhuma combinação setor/tipo com aderência crítica.",
        }

    return {
        "period_months": period_months,
        "cells": cells,
        "insight_lead": insight,
    }


def _compute_funil_execucao(
    active_rows: list[dict[str, Any]],
    reference_date: date,
    period_start: date,
    period_end: date,
) -> dict[str, Any]:
    """P7: execution funnel (planejadas → realizadas ≤30d → score ≥ 70)."""
    due_rows = [
        r
        for r in active_rows
        if (eff := _effective_date(r)) is not None
        and period_start <= eff <= period_end
        and eff <= reference_date
    ]
    planejadas_count = len(due_rows)

    realizadas_30d = [r for r in due_rows if _has_execution(r) and _executed_within_tolerance(r)]
    realizadas_30d_count = len(realizadas_30d)

    score_gte_70 = [
        r
        for r in realizadas_30d
        if (s := r.get("AuditScore")) is not None
        and _safe_float(s) is not None
        and (_safe_float(s) or 0) >= FUNIL_SCORE_THRESHOLD
    ]
    score_count = len(score_gte_70)

    replanned_count = sum(1 for r in due_rows if _is_replanned(r))
    out_of_tolerance = sum(
        1 for r in due_rows if _has_execution(r) and not _executed_within_tolerance(r)
    )

    stages: list[dict[str, Any]] = [
        {"id": "planejadas", "count": planejadas_count, "label": "Planejadas"},
        {
            "id": "realizadas-30d",
            "count": realizadas_30d_count,
            "label": "Realizadas (\u226430d)",
            "conversion_pct": _safe_pct(realizadas_30d_count, planejadas_count),
        },
        {
            "id": "score-gte-70",
            "count": score_count,
            "label": "Score \u2265 70 (VDA B)",
            "conversion_pct": _safe_pct(score_count, realizadas_30d_count),
        },
    ]

    if planejadas_count > 0 and realizadas_30d_count == 0:
        insight: dict[str, str] = {
            "severity": "red",
            "text": (
                f"Nenhuma das {planejadas_count} auditorias planejadas foi "
                "concluída dentro de 30 dias. Verificar execução."
            ),
        }
    elif (
        realizadas_30d_count > 0
        and _safe_pct(score_count, realizadas_30d_count) is not None
        and (_safe_pct(score_count, realizadas_30d_count) or 0) < 50
    ):
        insight = {
            "severity": "yellow",
            "text": (
                "Menos de 50% das auditorias realizadas atingiram score "
                "\u2265 70 (VDA B). Avaliar qualidade das execuções."
            ),
        }
    else:
        insight = {
            "severity": "green",
            "text": "Funil de execução dentro dos parâmetros esperados.",
        }

    return {
        "stages": stages,
        "annotation": {
            "replanned_count": replanned_count,
            "out_of_tolerance_count": out_of_tolerance,
        },
        "insight_lead": insight,
    }


def _safe_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        f = float(value)
        return None if isnan(f) else f
    except (ValueError, TypeError):
        return None


def compute_auditorias_planejadas_charts(
    rows: list[dict[str, Any]],
    by_sector_rows: list[dict[str, Any]],
    *,
    reference_date: date,
    period_start: date,
    period_end: date,
    period_months: int = 12,
) -> dict[str, Any]:
    """Pure computation of 4 executive charts for auditorias-planejadas."""
    active_rows = _distinct_active_rows(rows)

    return {
        "report_id": "auditorias-planejadas",
        "reference_date": reference_date.isoformat(),
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "charts": {
            "aderencia-mensal": _compute_aderencia_mensal(
                active_rows, reference_date, period_start, period_end
            ),
            "replanejamento-scatter": _compute_replanejamento_scatter(
                active_rows, period_start, period_end
            ),
            "heatmap-setor-tipo": _compute_heatmap_setor_tipo(
                by_sector_rows, reference_date, period_months
            ),
            "funil-execucao": _compute_funil_execucao(
                active_rows, reference_date, period_start, period_end
            ),
        },
    }
