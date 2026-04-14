from fastapi import APIRouter, HTTPException, Query, status

from backend.app.schemas.report import ReportCatalogItem, ReportCatalogResponse, ReportResponse
from backend.app.services.report_service import (
    get_report_catalog,
    list_report_definitions,
    run_report,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=ReportCatalogResponse)
def list_reports() -> ReportCatalogResponse:
    report_definitions = list_report_definitions()
    report_items = [
        ReportCatalogItem(**report_catalog_item)
        for report_catalog_item in get_report_catalog(report_definitions)
    ]
    return ReportCatalogResponse(reports=report_items)


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

    return ReportResponse(**report_payload)
