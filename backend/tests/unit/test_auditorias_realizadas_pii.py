"""
TDD — testes de regressão LGPD para o relatório auditorias-realizadas.

Estes testes validam que dados pessoais sensíveis (PII) do auditor jamais
cheguem ao frontend pelo endpoint público, mesmo que a query SQL retorne
tais campos:

- AuditorDocumentType (tipo de documento — CPF/CNPJ/RG/etc.)
- AuditorDocumentNumber (número do documento — CPF/CNPJ/RG/etc.)

A defesa atual em ``backend/app/services/report_service.py`` já inclui
``AuditorDocumentNumber`` no denylist mas **não inclui**
``AuditorDocumentType``. Estes testes falharão de forma legítima até
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


REPORT_ID = "auditorias-realizadas"
REPORT_TITLE = "Auditorias Realizadas"


# ---------------------------------------------------------------------------
# 1. Denylist do serviço (camada de sanitização)
# ---------------------------------------------------------------------------


class TestServiceDenylistCoversAuditorPii:
    def test_denylist_includes_auditor_document_type(self) -> None:
        """AuditorDocumentType é PII e deve estar no denylist do serviço."""
        assert "AuditorDocumentType" in SENSITIVE_FIELDS_DENYLIST, (
            "AuditorDocumentType deve estar em SENSITIVE_FIELDS_DENYLIST "
            "para evitar vazamento de tipo de documento (CPF/CNPJ/RG) do auditor"
        )

    def test_denylist_includes_auditor_document_number(self) -> None:
        """AuditorDocumentNumber é PII e deve estar no denylist do serviço."""
        assert "AuditorDocumentNumber" in SENSITIVE_FIELDS_DENYLIST, (
            "AuditorDocumentNumber deve estar em SENSITIVE_FIELDS_DENYLIST"
        )


class TestSanitizeReportRowsStripsAuditorPii:
    def test_sanitize_strips_auditor_document_type(self) -> None:
        """sanitize_report_rows deve remover AuditorDocumentType de cada linha."""
        rows = [
            {
                "AuditCode": 1,
                "AuditorName": "Carlos",
                "AuditorDocumentType": "CPF",
                "AuditorDocumentNumber": "987.654.321-00",
            }
        ]
        sanitized = sanitize_report_rows(rows)
        assert len(sanitized) == 1
        assert "AuditorDocumentType" not in sanitized[0], (
            "AuditorDocumentType deve ser removido pela sanitização"
        )
        assert "AuditorDocumentNumber" not in sanitized[0], (
            "AuditorDocumentNumber deve ser removido pela sanitização"
        )

    def test_sanitize_preserves_non_sensitive_fields(self) -> None:
        """sanitize_report_rows não deve remover campos não sensíveis."""
        rows = [
            {
                "AuditCode": 1,
                "AuditorName": "Carlos",
                "CompanyCorporateName": "Magna",
                "AuditorDocumentType": "CPF",
            }
        ]
        sanitized = sanitize_report_rows(rows)
        assert sanitized[0]["AuditCode"] == 1
        assert sanitized[0]["AuditorName"] == "Carlos"
        assert sanitized[0]["CompanyCorporateName"] == "Magna"


# ---------------------------------------------------------------------------
# 2. Contrato da rota — payload do endpoint não expõe PII
# ---------------------------------------------------------------------------


class TestAuditoriasRealizadasRouteHidesPii:
    @patch("backend.app.api.routes.reports.run_report")
    def test_route_payload_does_not_expose_auditor_document_type(
        self, mock_run_report: object, client: TestClient
    ) -> None:
        """Mesmo que o DB retorne AuditorDocumentType, ele NÃO deve chegar ao frontend."""
        mock_run_report.return_value = {  # type: ignore[attr-defined]
            "report_id": REPORT_ID,
            "title": REPORT_TITLE,
            "limit": 25,
            "offset": 0,
            "row_count": 1,
            "rows": [
                {
                    "AuditCode": 501,
                    "CompanyCorporateName": "Magna",
                    "AuditorName": "Carlos",
                    "AuditorDocumentType": "CPF",
                    "AuditorDocumentNumber": "987.654.321-00",
                }
            ],
        }

        response = client.get(f"/api/v1/reports/{REPORT_ID}?limit=25")

        assert response.status_code == 200
        rows = response.json()["rows"]
        assert len(rows) == 1
        assert "AuditorDocumentType" not in rows[0], (
            "PII 'AuditorDocumentType' não pode aparecer no payload do endpoint"
        )
        assert "AuditorDocumentNumber" not in rows[0], (
            "PII 'AuditorDocumentNumber' não pode aparecer no payload do endpoint"
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
                    "AuditCode": 501,
                    "CompanyCorporateName": "Magna",
                    "AuditorName": "Carlos",
                    "AuditorDocumentType": "CPF",
                    "AuditorDocumentNumber": "987.654.321-00",
                    "AuditStartDate": "2026-04-14",
                }
            ],
        }

        response = client.get(f"/api/v1/reports/{REPORT_ID}?limit=25")

        assert response.status_code == 200
        row = response.json()["rows"][0]
        assert row["AuditCode"] == 501
        assert row["CompanyCorporateName"] == "Magna"
        assert row["AuditorName"] == "Carlos"
        assert row["AuditStartDate"] == "2026-04-14"
