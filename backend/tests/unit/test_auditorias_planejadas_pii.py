"""
TDD — testes de regressão LGPD para o relatório auditorias-planejadas.

Estes testes validam que dados pessoais sensíveis (PII) jamais cheguem ao
frontend pelo endpoint público, mesmo que a query SQL retorne tais campos:

- ResponsibleDocumentType (tipo de documento — CPF/CNPJ/RG/etc.)
- ResponsibleDocumentNumber (número do documento — CPF/CNPJ/RG/etc.)

A defesa atual em ``backend/app/services/report_service.py`` já inclui
``ResponsibleDocumentNumber`` no denylist mas **não inclui**
``ResponsibleDocumentType``. Estes testes falharão de forma legítima até
que ambos sejam removidos do payload.
"""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from backend.app.main import create_application
from backend.app.services.report_service import (
    SENSITIVE_FIELDS_DENYLIST,
    sanitize_report_rows,
)


@pytest.fixture()
def client() -> TestClient:
    app = create_application()
    with TestClient(app) as test_client:
        yield test_client


REPORT_ID = "auditorias-planejadas"
REPORT_TITLE = "Auditorias Planejadas"


# ---------------------------------------------------------------------------
# 1. Denylist do serviço (camada de sanitização)
# ---------------------------------------------------------------------------


class TestServiceDenylistCoversResponsiblePii:
    def test_denylist_includes_responsible_document_type(self) -> None:
        """ResponsibleDocumentType é PII e deve estar no denylist do serviço."""
        assert "ResponsibleDocumentType" in SENSITIVE_FIELDS_DENYLIST, (
            "ResponsibleDocumentType deve estar em SENSITIVE_FIELDS_DENYLIST "
            "para evitar vazamento de tipo de documento (CPF/CNPJ/RG)"
        )

    def test_denylist_includes_responsible_document_number(self) -> None:
        """ResponsibleDocumentNumber é PII e deve estar no denylist do serviço."""
        assert "ResponsibleDocumentNumber" in SENSITIVE_FIELDS_DENYLIST, (
            "ResponsibleDocumentNumber deve estar em SENSITIVE_FIELDS_DENYLIST"
        )


class TestSanitizeReportRowsStripsResponsiblePii:
    def test_sanitize_strips_responsible_document_type(self) -> None:
        """sanitize_report_rows deve remover ResponsibleDocumentType de cada linha."""
        rows = [
            {
                "AuditingPlanningCode": 1,
                "ResponsibleName": "Ana",
                "ResponsibleDocumentType": "CPF",
                "ResponsibleDocumentNumber": "123.456.789-00",
            }
        ]
        sanitized = sanitize_report_rows(rows)
        assert len(sanitized) == 1
        assert "ResponsibleDocumentType" not in sanitized[0], (
            "ResponsibleDocumentType deve ser removido pela sanitização"
        )
        assert "ResponsibleDocumentNumber" not in sanitized[0], (
            "ResponsibleDocumentNumber deve ser removido pela sanitização"
        )

    def test_sanitize_preserves_non_sensitive_fields(self) -> None:
        """sanitize_report_rows não deve remover campos não sensíveis."""
        rows = [
            {
                "AuditingPlanningCode": 1,
                "ResponsibleName": "Ana",
                "CompanyCorporateName": "Magna",
                "ResponsibleDocumentType": "CPF",
            }
        ]
        sanitized = sanitize_report_rows(rows)
        assert sanitized[0]["AuditingPlanningCode"] == 1
        assert sanitized[0]["ResponsibleName"] == "Ana"
        assert sanitized[0]["CompanyCorporateName"] == "Magna"


# ---------------------------------------------------------------------------
# 2. Contrato da rota — payload do endpoint não expõe PII
# ---------------------------------------------------------------------------


class TestAuditoriasPlanejadasRouteHidesPii:
    @patch("backend.app.api.routes.reports.run_report")
    def test_route_payload_does_not_expose_responsible_document_type(
        self, mock_run_report: object, client: TestClient
    ) -> None:
        """Mesmo que o DB retorne ResponsibleDocumentType, ele NÃO deve chegar ao frontend."""
        mock_run_report.return_value = {  # type: ignore[attr-defined]
            "report_id": REPORT_ID,
            "title": REPORT_TITLE,
            "limit": 25,
            "offset": 0,
            "row_count": 1,
            "rows": [
                {
                    "AuditingPlanningCode": 101,
                    "CompanyCorporateName": "Magna",
                    "ResponsibleName": "Ana",
                    "ResponsibleDocumentType": "CPF",
                    "ResponsibleDocumentNumber": "123.456.789-00",
                }
            ],
        }

        response = client.get(f"/api/v1/reports/{REPORT_ID}?limit=25")

        assert response.status_code == 200
        rows = response.json()["rows"]
        assert len(rows) == 1
        assert "ResponsibleDocumentType" not in rows[0], (
            "PII 'ResponsibleDocumentType' não pode aparecer no payload do endpoint"
        )
        assert "ResponsibleDocumentNumber" not in rows[0], (
            "PII 'ResponsibleDocumentNumber' não pode aparecer no payload do endpoint"
        )

    @patch("backend.app.api.routes.reports.run_report")
    def test_route_payload_preserves_non_pii_fields(
        self, mock_run_report: object, client: TestClient
    ) -> None:
        """Sanitização não pode quebrar os demais campos do relatório."""
        mock_run_report.return_value = {  # type: ignore[attr-defined]
            "report_id": REPORT_ID,
            "title": REPORT_TITLE,
            "limit": 25,
            "offset": 0,
            "row_count": 1,
            "rows": [
                {
                    "AuditingPlanningCode": 101,
                    "CompanyCorporateName": "Magna",
                    "ResponsibleName": "Ana",
                    "ResponsibleDocumentType": "CPF",
                    "ResponsibleDocumentNumber": "123.456.789-00",
                    "AuditingPlanningPlannedDate": "2026-04-14",
                }
            ],
        }

        response = client.get(f"/api/v1/reports/{REPORT_ID}?limit=25")

        assert response.status_code == 200
        row = response.json()["rows"][0]
        assert row["AuditingPlanningCode"] == 101
        assert row["CompanyCorporateName"] == "Magna"
        assert row["ResponsibleName"] == "Ana"
        assert row["AuditingPlanningPlannedDate"] == "2026-04-14"
