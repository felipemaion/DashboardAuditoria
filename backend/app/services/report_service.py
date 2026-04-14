from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal, TypedDict

from pymysql.err import OperationalError

from backend.app.repositories.report_repository import fetch_report_rows


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
                blocked_reason=str(error.args[1]),
            )
        return ReportStatus(status="query_error", blocked_reason=str(error))
    except Exception as error:
        return ReportStatus(status="query_error", blocked_reason=str(error))

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
    return f"SELECT * FROM ({normalized_query}) AS report_rows LIMIT %s OFFSET %s"  # noqa: S608


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
