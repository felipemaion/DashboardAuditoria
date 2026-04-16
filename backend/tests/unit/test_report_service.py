from unittest.mock import patch

from pytest import raises

from backend.app.services.report_service import (
    REPORT_DEFINITIONS,
    SENSITIVE_FIELDS_DENYLIST,
    TYPO_ALIAS_DENYLIST,
    ReportDefinition,
    ReportStatus,
    build_paginated_report_query,
    get_report_catalog,
    get_report_definition,
    list_report_definitions,
    sanitize_report_rows,
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


def test_sanitize_report_rows_strips_sensitive_fields() -> None:
    rows = [{"activityCode": 1, "ResponsibleDocumentNumber": "123.456.789-00", "auditScore": 90.0}]
    result = sanitize_report_rows(rows)
    assert result == [{"activityCode": 1, "auditScore": 90.0}]


def test_sanitize_report_rows_strips_typo_aliases() -> None:
    rows = [
        {
            "activityCode": 1,
            "auditAuditorPerSOnName": "typo",
            "auditSECtorDescription": "typo",
            "auditLevelDescriPTion": "typo",
            "auditAuditorPersonName": "correct",
        }
    ]
    result = sanitize_report_rows(rows)
    assert "auditAuditorPerSOnName" not in result[0]
    assert "auditSECtorDescription" not in result[0]
    assert "auditLevelDescriPTion" not in result[0]
    assert result[0]["auditAuditorPersonName"] == "correct"


def test_sanitize_report_rows_preserves_safe_fields() -> None:
    rows = [
        {
            "activityCode": 42,
            "auditScore": 88.5,
            "auditStatus": 2,
            "auditEndDate": "2025-12-31",
            "auditPlannedDate": "2025-11-01",
            "activityDeadline": "2025-10-15",
            "activityPlannedDate": "2025-09-01",
            "activityClosed": 1,
            "activityFailed": 0,
        }
    ]
    result = sanitize_report_rows(rows)
    assert result == rows


def test_sanitize_report_rows_returns_empty_list_unchanged() -> None:
    assert sanitize_report_rows([]) == []


def test_sensitive_fields_denylist_contains_pii_document_fields() -> None:
    assert "ResponsibleDocumentNumber" in SENSITIVE_FIELDS_DENYLIST
    assert "AuditorDocumentNumber" in SENSITIVE_FIELDS_DENYLIST


def test_typo_alias_denylist_contains_all_broken_aliases() -> None:
    assert "auditAuditorPerSOnName" in TYPO_ALIAS_DENYLIST
    assert "auditSECtorDescription" in TYPO_ALIAS_DENYLIST
    assert "auditLevelDescriPTion" in TYPO_ALIAS_DENYLIST


def test_probe_report_definition_does_not_leak_mysql_details_on_permission_error() -> None:
    """blocked_reason must not contain internal MySQL user/host details for error 1142."""
    from unittest.mock import patch

    from pymysql.err import OperationalError

    from backend.app.services.report_service import REPORT_DEFINITIONS, probe_report_definition

    internal_detail = (
        "SELECT command denied to user 'app_user'@'db-host.internal' for table 'SomeTable'"
    )
    operational_error = OperationalError(1142, internal_detail)

    with patch(
        "backend.app.services.report_service.fetch_report_rows",
        side_effect=operational_error,
    ):
        result = probe_report_definition(REPORT_DEFINITIONS["auditorias-planejadas"])

    assert result.status == "blocked_by_permissions"
    assert "app_user" not in (result.blocked_reason or "")
    assert "db-host" not in (result.blocked_reason or "")
    assert result.blocked_reason == "Access denied"


def test_probe_report_definition_does_not_leak_mysql_details_on_query_error() -> None:
    """blocked_reason must not expose internal error messages for unexpected DB errors."""
    from unittest.mock import patch

    from pymysql.err import OperationalError

    from backend.app.services.report_service import REPORT_DEFINITIONS, probe_report_definition

    internal_detail = "Lost connection to MySQL server at 'db-host.internal:3306'"
    operational_error = OperationalError(2013, internal_detail)

    with patch(
        "backend.app.services.report_service.fetch_report_rows",
        side_effect=operational_error,
    ):
        result = probe_report_definition(REPORT_DEFINITIONS["auditorias-planejadas"])

    assert result.status == "query_error"
    assert "db-host" not in (result.blocked_reason or "")
    assert result.blocked_reason == "Query execution error"
