from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Query, status

from backend.app.schemas.report import (
    AuditoriasPlanejadasChartsResponse,
    AuditoriasPlanejadasKpisResponse,
    ReportCatalogItem,
    ReportCatalogResponse,
    ReportResponse,
)
from backend.app.services.report_service import (
    compute_auditorias_planejadas_charts,
    compute_auditorias_planejadas_kpis,
    fetch_audits_kpi_base_by_sector_rows,
    fetch_audits_kpi_base_rows,
    get_report_catalog,
    list_report_definitions,
    run_report,
    sanitize_report_rows,
)

router = APIRouter(prefix="/reports", tags=["reports"])

DEFAULT_KPI_PERIOD_DAYS = 90


@router.get("", response_model=ReportCatalogResponse)
def list_reports() -> ReportCatalogResponse:
    report_definitions = list_report_definitions()
    report_items = [
        ReportCatalogItem(**report_catalog_item)
        for report_catalog_item in get_report_catalog(report_definitions)
    ]
    return ReportCatalogResponse(reports=report_items)


@router.get(
    "/auditorias-planejadas/kpis",
    response_model=AuditoriasPlanejadasKpisResponse,
)
def get_auditorias_planejadas_kpis(
    period_start: date | None = Query(default=None),
    period_end: date | None = Query(default=None),
    reference_date: date | None = Query(default=None),
) -> AuditoriasPlanejadasKpisResponse:
    effective_reference = reference_date or date.today()
    effective_period_end = period_end or effective_reference
    effective_period_start = period_start or (
        effective_period_end - timedelta(days=DEFAULT_KPI_PERIOD_DAYS)
    )

    try:
        rows = fetch_audits_kpi_base_rows()
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="KPI query execution failed.",
        ) from error

    payload = compute_auditorias_planejadas_kpis(
        rows,
        reference_date=effective_reference,
        period_start=effective_period_start,
        period_end=effective_period_end,
    )
    return AuditoriasPlanejadasKpisResponse(**payload)


DEFAULT_HEATMAP_PERIOD_MONTHS = 12


@router.get(
    "/auditorias-planejadas/charts",
    response_model=AuditoriasPlanejadasChartsResponse,
)
def get_auditorias_planejadas_charts(
    period_start: date | None = Query(default=None),
    period_end: date | None = Query(default=None),
    reference_date: date | None = Query(default=None),
    period_months: int = Query(default=DEFAULT_HEATMAP_PERIOD_MONTHS, ge=3, le=60),
) -> AuditoriasPlanejadasChartsResponse:
    effective_reference = reference_date or date.today()
    effective_period_end = period_end or effective_reference
    effective_period_start = period_start or (
        effective_period_end - timedelta(days=DEFAULT_KPI_PERIOD_DAYS)
    )

    try:
        rows = fetch_audits_kpi_base_rows()
        by_sector_rows = fetch_audits_kpi_base_by_sector_rows()
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Charts query execution failed.",
        ) from error

    payload = compute_auditorias_planejadas_charts(
        rows,
        by_sector_rows,
        reference_date=effective_reference,
        period_start=effective_period_start,
        period_end=effective_period_end,
        period_months=period_months,
    )
    return AuditoriasPlanejadasChartsResponse(**payload)


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: str,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> ReportResponse:
    try:
        report_payload = run_report(report_id, limit=limit, offset=offset)
    except KeyError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Report query execution failed.",
        ) from error

    report_payload["rows"] = sanitize_report_rows(report_payload["rows"])
    return ReportResponse(**report_payload)
