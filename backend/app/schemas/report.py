from typing import Any, Literal

from pydantic import BaseModel, Field


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
