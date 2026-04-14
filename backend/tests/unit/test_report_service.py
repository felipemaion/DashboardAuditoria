from unittest.mock import patch

from pytest import raises

from backend.app.services.report_service import (
    REPORT_DEFINITIONS,
    ReportDefinition,
    ReportStatus,
    build_paginated_report_query,
    get_report_catalog,
    get_report_definition,
    list_report_definitions,
)


def test_get_report_definition_returns_expected_report() -> None:
    report_definition = get_report_definition("auditorias-planejadas")

    assert report_definition == ReportDefinition(
        report_id="auditorias-planejadas",
        title="Auditorias Planejadas",
        sql_file=REPORT_DEFINITIONS["auditorias-planejadas"].sql_file,
    )


def test_get_report_definition_raises_for_unknown_report() -> None:
    with raises(KeyError):
        get_report_definition("desconhecido")


def test_list_report_definitions_returns_all_registered_reports() -> None:
    report_definitions = list_report_definitions()

    assert [report_definition.report_id for report_definition in report_definitions] == [
        "atividades-completas",
        "atividades-de-auditoria",
        "auditorias-planejadas",
        "auditorias-realizadas",
        "nao-conformidade",
        "ocorrencias-com-e-sem-atividade",
        "ocorrencias-com-indicador",
        "ocorrencias-ff",
    ]


def test_get_report_catalog_marks_available_and_blocked_reports() -> None:
    report_definitions = [
        ReportDefinition(
            report_id="auditorias-planejadas",
            title="Auditorias Planejadas",
            sql_file=REPORT_DEFINITIONS["auditorias-planejadas"].sql_file,
        ),
        ReportDefinition(
            report_id="atividades-completas",
            title="Atividades Completas",
            sql_file=REPORT_DEFINITIONS["atividades-completas"].sql_file,
        ),
    ]

    with patch(
        "backend.app.services.report_service.probe_report_definition",
        side_effect=[
            ReportStatus(status="available", blocked_reason=None),
            ReportStatus(status="blocked_by_permissions", blocked_reason="SELECT denied"),
        ],
    ):
        report_catalog = get_report_catalog(report_definitions)

    assert report_catalog == [
        {
            "report_id": "auditorias-planejadas",
            "title": "Auditorias Planejadas",
            "sql_file_name": "auditorias_planejadas.sql",
            "status": "available",
            "blocked_reason": None,
        },
        {
            "report_id": "atividades-completas",
            "title": "Atividades Completas",
            "sql_file_name": "atividades_completas.sql",
            "status": "blocked_by_permissions",
            "blocked_reason": "SELECT denied",
        },
    ]


def test_build_paginated_report_query_wraps_base_query() -> None:
    query = build_paginated_report_query("SELECT id, name FROM planned_audits")

    assert query == (
        "SELECT * FROM (SELECT id, name FROM planned_audits) AS report_rows LIMIT %s OFFSET %s"
    )


def test_build_paginated_report_query_removes_trailing_semicolon() -> None:
    query = build_paginated_report_query("SELECT id FROM planned_audits;")

    assert query == (
        "SELECT * FROM (SELECT id FROM planned_audits) AS report_rows LIMIT %s OFFSET %s"
    )


def test_build_paginated_report_query_escapes_percent_characters() -> None:
    query = build_paginated_report_query(
        "SELECT REGEXP_REPLACE(details, '<[^>]*>', '') AS cleaned_value, "
        "score * 100 % 10 AS remainder"
    )

    assert query == (
        "SELECT * FROM (SELECT REGEXP_REPLACE(details, '<[^>]*>', '') AS cleaned_value, "
        "score * 100 %% 10 AS remainder) AS report_rows LIMIT %s OFFSET %s"
    )
