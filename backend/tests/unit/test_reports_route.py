from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.services.report_service import ReportDefinition


@patch("backend.app.api.routes.reports.get_report_catalog")
@patch("backend.app.api.routes.reports.list_report_definitions")
def test_reports_catalog_route_returns_registered_reports(
    mock_list_report_definitions, mock_get_report_catalog, client: TestClient
) -> None:
    mock_list_report_definitions.return_value = [
        ReportDefinition(
            report_id="auditorias-planejadas",
            title="Auditorias Planejadas",
            sql_file=Path(
                "/Users/maion/Projects/DashboardMagna/database/views/mysql/auditorias_planejadas.sql"
            ),
        ),
        ReportDefinition(
            report_id="ocorrencias-com-indicador",
            title="Ocorrencias com Indicador",
            sql_file=Path(
                "/Users/maion/Projects/DashboardMagna/database/views/mysql/ocorrencias_com_indicador.sql"
            ),
        ),
    ]
    mock_get_report_catalog.return_value = [
        {
            "report_id": "auditorias-planejadas",
            "title": "Auditorias Planejadas",
            "sql_file_name": "auditorias_planejadas.sql",
            "status": "available",
            "blocked_reason": None,
        },
        {
            "report_id": "ocorrencias-com-indicador",
            "title": "Ocorrencias com Indicador",
            "sql_file_name": "ocorrencias_com_indicador.sql",
            "status": "blocked_by_permissions",
            "blocked_reason": "SELECT denied",
        },
    ]

    response = client.get("/api/v1/reports")

    assert response.status_code == 200
    assert response.json() == {
        "reports": [
            {
                "report_id": "auditorias-planejadas",
                "title": "Auditorias Planejadas",
                "sql_file_name": "auditorias_planejadas.sql",
                "status": "available",
                "blocked_reason": None,
            },
            {
                "report_id": "ocorrencias-com-indicador",
                "title": "Ocorrencias com Indicador",
                "sql_file_name": "ocorrencias_com_indicador.sql",
                "status": "blocked_by_permissions",
                "blocked_reason": "SELECT denied",
            },
        ]
    }
    mock_list_report_definitions.assert_called_once()
    mock_get_report_catalog.assert_called_once()


@patch("backend.app.api.routes.reports.run_report")
def test_report_route_returns_paginated_rows(mock_run_report, client: TestClient) -> None:
    mock_run_report.return_value = {
        "report_id": "auditorias-planejadas",
        "title": "Auditorias Planejadas",
        "limit": 25,
        "offset": 0,
        "row_count": 1,
        "rows": [{"AuditingPlanningCode": 101, "CompanyCorporateName": "Magna"}],
    }

    response = client.get("/api/v1/reports/auditorias-planejadas?limit=25&offset=0")

    assert response.status_code == 200
    assert response.json() == {
        "report_id": "auditorias-planejadas",
        "title": "Auditorias Planejadas",
        "limit": 25,
        "offset": 0,
        "row_count": 1,
        "rows": [{"AuditingPlanningCode": 101, "CompanyCorporateName": "Magna"}],
    }


def test_report_route_rejects_invalid_limit(client: TestClient) -> None:
    response = client.get("/api/v1/reports/auditorias-planejadas?limit=0")

    assert response.status_code == 422


@patch("backend.app.api.routes.reports.run_report")
def test_report_route_returns_not_found_for_unknown_report(
    mock_run_report, client: TestClient
) -> None:
    mock_run_report.side_effect = KeyError("unknown report")

    response = client.get("/api/v1/reports/desconhecido")

    assert response.status_code == 404
    assert response.json() == {"detail": "Report not found."}


@patch("backend.app.api.routes.reports.run_report")
def test_report_route_supports_other_registered_sql_files(
    mock_run_report, client: TestClient
) -> None:
    mock_run_report.return_value = {
        "report_id": "ocorrencias-com-indicador",
        "title": "Ocorrencias com Indicador",
        "limit": 5,
        "offset": 0,
        "row_count": 1,
        "rows": [{"Issue #": 10, "Defect": "Flash"}],
    }

    response = client.get("/api/v1/reports/ocorrencias-com-indicador?limit=5")

    assert response.status_code == 200
    assert response.json() == {
        "report_id": "ocorrencias-com-indicador",
        "title": "Ocorrencias com Indicador",
        "limit": 5,
        "offset": 0,
        "row_count": 1,
        "rows": [{"Issue #": 10, "Defect": "Flash"}],
    }


@patch("backend.app.api.routes.reports.run_report")
def test_report_route_returns_controlled_error_when_query_execution_fails(
    mock_run_report, client: TestClient
) -> None:
    mock_run_report.side_effect = RuntimeError("legacy SQL failed")

    response = client.get("/api/v1/reports/ocorrencias-com-indicador")

    assert response.status_code == 502
    assert response.json() == {"detail": "Report query execution failed."}
