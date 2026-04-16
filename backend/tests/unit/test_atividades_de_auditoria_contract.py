"""
TDD — testes de contrato para o relatório atividades-de-auditoria.

Estes testes validam:
- Ausência de aliases com typo (auditAuditorPerSOnName, auditSECtorDescription,
  auditLevelDescriPTion) no SQL legado
- Presença dos aliases corrigidos no SELECT externo do SQL
- Presença dos 8 novos campos no SELECT externo
- Uso de DISTINCT activityCode (sem duplicatas por atividade)
- Filtro ativo de TupleExcluded = 0 (linhas excluídas não aparecem)
- Ausência de ResponsibleDocumentNumber no payload

Os testes de estrutura SQL falharão enquanto o SQL não for corrigido.
Os testes de rota/serviço falharão enquanto o schema não for atualizado.
"""

import re
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from backend.app.main import create_application
from backend.app.services.report_service import PROJECT_ROOT

SQL_PATH = PROJECT_ROOT / "database" / "views" / "mysql" / "atividades_de_auditoria.sql"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def sql_text() -> str:
    return SQL_PATH.read_text(encoding="utf-8")


@pytest.fixture(scope="module")
def outer_select(sql_text: str) -> str:
    """Extrai o SELECT externo (antes do primeiro FROM (...))."""
    match = re.search(r"(?i)^\s*SELECT\s+(.*?)\s*FROM\s*\(", sql_text, re.DOTALL)
    assert match, "Não foi possível localizar o SELECT externo no SQL"
    return match.group(1).lower()


@pytest.fixture()
def client() -> TestClient:
    app = create_application()
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# 1. Ausência de aliases com typo no SQL
# ---------------------------------------------------------------------------


class TestSqlTypoAliasesAbsent:
    def test_no_typo_auditAuditorPerSOnName(self, sql_text: str) -> None:  # noqa: N802
        """auditAuditorPerSOnName deve ter sido corrigido para auditAuditorPersonName."""
        assert "auditAuditorPerSOnName" not in sql_text, (
            "Typo 'auditAuditorPerSOnName' ainda presente no SQL"
        )

    def test_no_typo_auditSECtorDescription(self, sql_text: str) -> None:  # noqa: N802
        """auditSECtorDescription deve ter sido corrigido para auditSectorDescription."""
        assert "auditSECtorDescription" not in sql_text, (
            "Typo 'auditSECtorDescription' ainda presente no SQL"
        )

    def test_no_typo_auditLevelDescriPTion(self, sql_text: str) -> None:  # noqa: N802
        """auditLevelDescriPTion deve ter sido corrigido para auditLevelDescription."""
        assert "auditLevelDescriPTion" not in sql_text, (
            "Typo 'auditLevelDescriPTion' ainda presente no SQL"
        )


# ---------------------------------------------------------------------------
# 2. Presença dos aliases corrigidos no SELECT externo
# ---------------------------------------------------------------------------


class TestSqlCorrectedAliasesPresent:
    def test_outer_select_contains_auditAuditorPersonName(self, outer_select: str) -> None:  # noqa: N802
        assert "auditauditorpersonname" in outer_select, (
            "auditAuditorPersonName ausente do SELECT externo"
        )

    def test_outer_select_contains_auditSectorDescription(self, outer_select: str) -> None:  # noqa: N802
        assert "auditsectordescription" in outer_select, (
            "auditSectorDescription ausente do SELECT externo"
        )

    def test_outer_select_contains_auditLevelDescription(self, outer_select: str) -> None:  # noqa: N802
        assert "auditleveldescription" in outer_select, (
            "auditLevelDescription ausente do SELECT externo"
        )


# ---------------------------------------------------------------------------
# 3. Presença dos 8 novos campos no SELECT externo
# ---------------------------------------------------------------------------


class TestSqlNewFieldsPresent:
    @pytest.mark.parametrize(
        "field",
        [
            "auditscore",
            "auditstatus",
            "auditenddate",
            "auditplanneddate",
            "activitydeadline",
            "activityplanneddate",
            "activityclosed",
            "activityfailed",
        ],
    )
    def test_outer_select_contains_new_field(self, outer_select: str, field: str) -> None:
        assert field in outer_select, f"Campo '{field}' ausente do SELECT externo"


# ---------------------------------------------------------------------------
# 4. DISTINCT activityCode — sem duplicatas por atividade
# ---------------------------------------------------------------------------


class TestSqlDistinctActivityCode:
    def test_outer_select_uses_distinct(self, sql_text: str) -> None:
        """O SELECT externo deve usar DISTINCT activityCode."""
        outer_region = sql_text[: sql_text.upper().find("FROM\n(")].upper()
        assert "DISTINCT" in outer_region, (
            "SELECT externo não utiliza DISTINCT — atividades duplicadas podem aparecer"
        )


# ---------------------------------------------------------------------------
# 5. Filtro de TupleExcluded ativo
# ---------------------------------------------------------------------------


class TestSqlTupleExcludedFilter:
    def test_activity_tuple_excluded_filter_active(self, sql_text: str) -> None:
        """WHERE A.Activity_TupleExcluded = 0 deve estar descomentado."""
        pattern = re.compile(r"(?<!--).*Activity_TupleExcluded\s*=\s*0", re.IGNORECASE)
        assert pattern.search(sql_text), (
            "Filtro Activity_TupleExcluded = 0 está comentado ou ausente"
        )

    def test_audit_tuple_excluded_filter_active(self, sql_text: str) -> None:
        """WHERE AU.Audit_TupleExcluded = 0 deve estar descomentado."""
        pattern = re.compile(r"(?<!--).*Audit_TupleExcluded\s*=\s*0", re.IGNORECASE)
        assert pattern.search(sql_text), "Filtro Audit_TupleExcluded = 0 está comentado ou ausente"


# ---------------------------------------------------------------------------
# 6. ResponsibleDocumentNumber não exposto no payload
# ---------------------------------------------------------------------------


class TestResponsibleDocumentNumberAbsent:
    def test_sql_does_not_contain_responsible_document_number(self, sql_text: str) -> None:
        assert "ResponsibleDocumentNumber" not in sql_text, (
            "Campo sensível 'ResponsibleDocumentNumber' não deve constar no SQL"
        )

    @patch("backend.app.api.routes.reports.run_report")
    def test_route_payload_does_not_expose_responsible_document_number(
        self, mock_run_report: object, client: TestClient
    ) -> None:
        """Mesmo que o DB retorne o campo, ele não deve chegar ao frontend."""
        mock_run_report.return_value = {  # type: ignore[attr-defined]
            "report_id": "atividades-de-auditoria",
            "title": "Atividades de Auditoria",
            "limit": 5,
            "offset": 0,
            "row_count": 1,
            "rows": [
                {
                    "activityCode": 1,
                    "auditScore": 85.5,
                    "auditStatus": 2,
                    # campo sensível que NÃO deve aparecer
                    "ResponsibleDocumentNumber": "123.456.789-00",
                }
            ],
        }
        response = client.get("/api/v1/reports/atividades-de-auditoria?limit=5")
        assert response.status_code == 200
        rows = response.json()["rows"]
        assert len(rows) == 1
        assert "ResponsibleDocumentNumber" not in rows[0], (
            "Campo sensível 'ResponsibleDocumentNumber' não deve ser exposto pelo endpoint"
        )


# ---------------------------------------------------------------------------
# 7. Contrato de rota — novos campos chegam no payload
# ---------------------------------------------------------------------------


class TestRouteContractNewFields:
    @patch("backend.app.api.routes.reports.run_report")
    def test_route_returns_new_fields_when_present_in_rows(
        self, mock_run_report: object, client: TestClient
    ) -> None:
        """O endpoint deve passar adiante os 8 novos campos sem filtrar ou renomear."""
        expected_row = {
            "activityCode": 42,
            "auditScore": 91.0,
            "auditStatus": 1,
            "auditEndDate": "2025-12-31",
            "auditPlannedDate": "2025-11-01",
            "activityDeadline": "2025-10-15",
            "activityPlannedDate": "2025-09-01",
            "activityClosed": 1,
            "activityFailed": 0,
            "auditAuditorPersonName": "João Silva",
            "auditSectorDescription": "Qualidade",
            "auditLevelDescription": "Nível 1",
        }
        mock_run_report.return_value = {  # type: ignore[attr-defined]
            "report_id": "atividades-de-auditoria",
            "title": "Atividades de Auditoria",
            "limit": 5,
            "offset": 0,
            "row_count": 1,
            "rows": [expected_row],
        }
        response = client.get("/api/v1/reports/atividades-de-auditoria?limit=5")
        assert response.status_code == 200
        row = response.json()["rows"][0]

        new_fields = [
            "auditScore",
            "auditStatus",
            "auditEndDate",
            "auditPlannedDate",
            "activityDeadline",
            "activityPlannedDate",
            "activityClosed",
            "activityFailed",
        ]
        for field in new_fields:
            assert field in row, f"Campo '{field}' ausente no payload da rota"

    @patch("backend.app.api.routes.reports.run_report")
    def test_route_does_not_expose_typo_aliases(
        self, mock_run_report: object, client: TestClient
    ) -> None:
        """O endpoint não deve retornar os aliases com typo antigos."""
        mock_run_report.return_value = {  # type: ignore[attr-defined]
            "report_id": "atividades-de-auditoria",
            "title": "Atividades de Auditoria",
            "limit": 5,
            "offset": 0,
            "row_count": 1,
            "rows": [
                {
                    "activityCode": 1,
                    # typos antigos que NÃO devem aparecer
                    "auditAuditorPerSOnName": "typo",
                    "auditSECtorDescription": "typo",
                    "auditLevelDescriPTion": "typo",
                }
            ],
        }
        response = client.get("/api/v1/reports/atividades-de-auditoria?limit=5")
        assert response.status_code == 200
        row = response.json()["rows"][0]

        typo_aliases = [
            "auditAuditorPerSOnName",
            "auditSECtorDescription",
            "auditLevelDescriPTion",
        ]
        for alias in typo_aliases:
            assert alias not in row, (
                f"Alias com typo '{alias}' não deve aparecer no payload — use o alias corrigido"
            )
