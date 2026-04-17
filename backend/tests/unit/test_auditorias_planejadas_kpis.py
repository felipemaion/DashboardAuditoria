"""TDD — testes contrato + cálculos para os 4 KPIs executivos de auditorias-planejadas.

Fórmulas CONGELADAS pelo CEO (Task #18). Cada teste comenta a fórmula usada para
auditoria futura. Os testes falham legitimamente até que a Fase B.4 (SQL) e B.5
(endpoint backend) implementem ``compute_auditorias_planejadas_kpis`` e a rota
``GET /api/v1/reports/auditorias-planejadas/kpis``.

------------------------------------------------------------------------------
KPI 1 — % Aderência ao Plano (thresholds: >=95 verde, 85-94 amarelo, <85 vermelho)

  Numerador (DISTINCT AuditingPlanningCode):
    AuditingPlanning.AuditingPlanning_TupleExcluded = 0
    AND existe match em auditorias-realizadas com Audit_Status = 2 (Realizada)
    AND Audit_StartDate <= COALESCE(ReplannedDate, PlannedDate) + INTERVAL 30 DAY

  Denominador (DISTINCT AuditingPlanningCode):
    AuditingPlanning.AuditingPlanning_TupleExcluded = 0
    AND COALESCE(ReplannedDate, PlannedDate) <= reference_date
    AND COALESCE(ReplannedDate, PlannedDate) BETWEEN period_start AND period_end

------------------------------------------------------------------------------
KPI 2 — % Replanejamento (thresholds: <=10 verde, 10-30 amarelo, >30 vermelho)

  Numerador (DISTINCT AuditingPlanningCode):
    TupleExcluded = 0
    AND ReplannedDate IS NOT NULL
    AND ReplannedDate <> PlannedDate          (antecipação conta como replanejamento)

  Denominador (DISTINCT AuditingPlanningCode):
    TupleExcluded = 0
    AND PlannedDate BETWEEN period_start AND period_end

------------------------------------------------------------------------------
KPI 3 — Auditorias Vencidas (% PRIMÁRIO + contagem absoluta secundária)
  Thresholds sobre %: <=2 verde, 2-5 amarelo, >5 vermelho.

  value_count (DISTINCT AuditingPlanningCode):
    TupleExcluded = 0
    AND COALESCE(ReplannedDate, PlannedDate) < reference_date
    AND (sem match em realizadas com Audit_Status=2
         OR match com Audit_StartDate > COALESCE(ReplannedDate, PlannedDate) + 30 dias)

  value_percent = value_count / total_planejadas_ativas_com_prazo<=reference_date * 100

------------------------------------------------------------------------------
KPI 4 — Próximas 30 dias (SEM cor — severity neutral; flag IATF 16949 §7.2.3)

  value_count (DISTINCT AuditingPlanningCode):
    TupleExcluded = 0
    AND COALESCE(ReplannedDate, PlannedDate) BETWEEN reference_date AND
        reference_date + INTERVAL 30 DAY
    AND sem match em realizadas com Audit_Status = 2

  iatf_unassigned_flag = True se qualquer planejamento elegível tiver
                         ResponsibleCode IS NULL (responsável não atribuído).
"""

from __future__ import annotations

from datetime import date
from typing import Any
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from backend.app.main import create_application


@pytest.fixture()
def client() -> TestClient:
    app = create_application()
    with TestClient(app) as test_client:
        yield test_client


REPORT_ID = "auditorias-planejadas"
KPIS_PATH = f"/api/v1/reports/{REPORT_ID}/kpis"

# Janela operacional padrão usada por todos os cenários de cálculo.
REFERENCE_DATE = date(2026, 4, 16)
PERIOD_START = date(2026, 1, 1)
PERIOD_END = date(2026, 4, 16)


# ---------------------------------------------------------------------------
# Fixtures de linhas — modelam o que SQL/Backend irão fornecer ao computador.
#
# Cada linha de planejamento traz:
#   AuditingPlanningCode, PlannedDate, ReplannedDate (opcional),
#   TupleExcluded (0/1), ResponsibleCode (opcional / None).
#
# Cada linha de realizada traz:
#   AuditingPlanningCode, Audit_StartDate, Audit_Status (2 = Realizada).
# ---------------------------------------------------------------------------


def _planned(
    code: int,
    planned: str,
    *,
    replanned: str | None = None,
    excluded: int = 0,
    responsible: int | None = 1,
) -> dict[str, Any]:
    return {
        "AuditingPlanningCode": code,
        "PlannedDate": planned,
        "ReplannedDate": replanned,
        "TupleExcluded": excluded,
        "ResponsibleCode": responsible,
    }


def _executed(
    planning_code: int,
    *,
    start: str,
    status: int = 2,
) -> dict[str, Any]:
    return {
        "AuditingPlanningCode": planning_code,
        "Audit_StartDate": start,
        "Audit_Status": status,
    }


def _rows(
    planned: list[dict[str, Any]],
    executed: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Merge legacy planned + executed fixtures into audits_kpi_base view rows.

    The view filters Audit_Status = 2 (Realizada) at SQL level, so only
    status=2 executions hydrate ExecutedAt in the merged row. Fixtures with
    other status simulate the view behaviour by leaving ExecutedAt NULL.
    """
    executed_by_code: dict[int, str] = {}
    for execution in executed:
        if execution.get("Audit_Status", 2) == 2:
            executed_by_code[execution["AuditingPlanningCode"]] = execution["Audit_StartDate"]
    merged: list[dict[str, Any]] = []
    for planning in planned:
        code = planning["AuditingPlanningCode"]
        merged.append({**planning, "ExecutedAt": executed_by_code.get(code)})
    return merged


# ---------------------------------------------------------------------------
# 1. Estrutura mínima do payload retornado pela função pura
# ---------------------------------------------------------------------------


class TestComputeKpisPayloadShape:
    def test_payload_returns_exactly_four_kpis_in_frozen_order(self) -> None:
        """Contrato: payload['kpis'] traz EXATAMENTE 4 KPIs na ordem CEO #18 (1→2→3→4)."""
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        payload = compute_auditorias_planejadas_kpis(
            rows=[],
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        assert payload["report_id"] == REPORT_ID
        assert payload["reference_date"] == REFERENCE_DATE.isoformat()
        assert payload["period_start"] == PERIOD_START.isoformat()
        assert payload["period_end"] == PERIOD_END.isoformat()
        assert isinstance(payload["kpis"], list)
        assert [kpi["id"] for kpi in payload["kpis"]] == [
            "aderencia-plano",
            "replanejamento",
            "auditorias-vencidas",
            "proximas-30-dias",
        ], "Ordem CEO: KPI1 Aderência → KPI2 Replanejamento → KPI3 Vencidas → KPI4 Próximas 30d"

    def test_kpi_4_carries_neutral_severity_with_no_threshold_metadata(self) -> None:
        """KPI 4 SEM cor: severity = 'neutral' e thresholds = None (decisão CEO #18)."""
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        payload = compute_auditorias_planejadas_kpis(
            rows=[],
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi_proximas = next(kpi for kpi in payload["kpis"] if kpi["id"] == "proximas-30-dias")
        assert kpi_proximas["severity"] == "neutral"
        assert kpi_proximas.get("thresholds") is None, (
            "KPI 4 não tem cor; metadados de threshold devem ser None"
        )


# ---------------------------------------------------------------------------
# 2. KPI 1 — % Aderência ao Plano
# ---------------------------------------------------------------------------


class TestKpiAderenciaPlano:
    def test_aderente_quando_realizada_em_ate_30d_apos_data_planejada(self) -> None:
        """Fórmula KPI1.

        Numerador: planejamento com TupleExcluded=0 que possui Audit_StartDate
        <= COALESCE(ReplannedDate, PlannedDate) + 30 dias e Audit_Status=2.
        Denominador: planejamentos ativos com prazo <= reference_date no período.

        Cenário: 2 planejamentos com prazo passado, ambos realizados dentro de 30d.
        Esperado: aderência = 100% (2/2), severity verde.
        """
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [
            _planned(101, "2026-02-10"),
            _planned(102, "2026-03-15"),
        ]
        executed = [
            _executed(101, start="2026-02-25"),  # 15 dias após — aderente
            _executed(102, start="2026-04-10"),  # 26 dias após — aderente
        ]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, executed),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "aderencia-plano")
        assert kpi["numerator"] == 2
        assert kpi["denominator"] == 2
        assert kpi["value_percent"] == pytest.approx(100.0)
        assert kpi["severity"] == "green"

    def test_realizada_apos_30d_quebra_aderencia(self) -> None:
        """Fórmula KPI1.

        Realizada com Audit_StartDate > COALESCE(prazo) + 30d NÃO conta no numerador.
        Cenário: 4 planejamentos, 3 dentro de 30d, 1 realizada após 31d.
        Esperado: aderência = 75% → faixa amarela (85-94 amarelo; 75 = vermelho).
        """
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [_planned(c, "2026-02-01") for c in (201, 202, 203, 204)]
        executed = [
            _executed(201, start="2026-02-20"),  # 19d — aderente
            _executed(202, start="2026-02-25"),  # 24d — aderente
            _executed(203, start="2026-03-01"),  # 28d — aderente
            _executed(204, start="2026-03-05"),  # 32d — quebra
        ]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, executed),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "aderencia-plano")
        assert kpi["numerator"] == 3
        assert kpi["denominator"] == 4
        assert kpi["value_percent"] == pytest.approx(75.0)
        assert kpi["severity"] == "red", "75% < 85% → faixa vermelha"

    def test_replanned_date_substitui_planned_date_para_aderencia(self) -> None:
        """Fórmula KPI1: tolerância usa COALESCE(ReplannedDate, PlannedDate).

        Cenário: PlannedDate=2026-02-01, ReplannedDate=2026-03-15. Realização em
        2026-04-10 está a 26 dias da data replanejada → aderente. Se a função
        usasse PlannedDate teria 68 dias e seria não-aderente.
        """
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [_planned(301, "2026-02-01", replanned="2026-03-15")]
        executed = [_executed(301, start="2026-04-10")]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, executed),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "aderencia-plano")
        assert kpi["numerator"] == 1
        assert kpi["denominator"] == 1
        assert kpi["value_percent"] == pytest.approx(100.0)

    def test_tuple_excluded_ignorado_em_ambos_numerador_e_denominador(self) -> None:
        """Fórmula KPI1: TupleExcluded=1 desconsidera completamente o planejamento."""
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [
            _planned(401, "2026-02-10"),
            _planned(402, "2026-02-10", excluded=1),
        ]
        executed = [
            _executed(401, start="2026-02-15"),
            _executed(402, start="2026-02-15"),
        ]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, executed),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "aderencia-plano")
        assert kpi["denominator"] == 1, "Apenas 401 é ativo (402 tem TupleExcluded=1)"
        assert kpi["numerator"] == 1

    def test_audit_status_diferente_de_2_nao_conta_como_realizada(self) -> None:
        """Fórmula KPI1: SQL Engineer (#41) confirmou que Audit_Status=2 é Realizada.

        Status 1/3 (em andamento, avulsa) NÃO contam para aderência mesmo
        com Audit_StartDate dentro da janela.
        """
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [
            _planned(501, "2026-02-10"),
            _planned(502, "2026-02-10"),
        ]
        executed = [
            _executed(501, start="2026-02-15", status=2),
            _executed(502, start="2026-02-15", status=3),  # não-realizada
        ]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, executed),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "aderencia-plano")
        assert kpi["numerator"] == 1, "502 não conta porque Audit_Status != 2"
        assert kpi["denominator"] == 2

    def test_planejamento_sem_prazo_vencido_fica_fora_do_denominador(self) -> None:
        """Fórmula KPI1: denominador exige COALESCE(prazo) <= reference_date."""
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [
            _planned(601, "2026-02-10"),  # vencido — entra
            _planned(602, "2026-12-01"),  # futuro — fica de fora
        ]
        executed = [_executed(601, start="2026-02-20")]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, executed),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "aderencia-plano")
        assert kpi["denominator"] == 1
        assert kpi["numerator"] == 1

    def test_denominador_zero_retorna_value_percent_none_sem_crash(self) -> None:
        """Edge case: divisão por zero não derruba a aplicação, retorna None.

        Severity correspondente é 'neutral' (sem dado para julgar).
        """
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        payload = compute_auditorias_planejadas_kpis(
            rows=[],
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "aderencia-plano")
        assert kpi["denominator"] == 0
        assert kpi["numerator"] == 0
        assert kpi["value_percent"] is None
        assert kpi["severity"] == "neutral"

    def test_threshold_amarelo_para_intervalo_85_a_94(self) -> None:
        """Fórmula KPI1 thresholds: 90% cai na faixa amarela (85-94).

        Cenário: 10 planejamentos, 9 aderentes → 90% → amarelo.
        """
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [_planned(700 + i, "2026-02-01") for i in range(10)]
        executed = [_executed(700 + i, start="2026-02-15") for i in range(9)]
        # 10º planejamento sem realização — não-aderente

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, executed),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "aderencia-plano")
        assert kpi["value_percent"] == pytest.approx(90.0)
        assert kpi["severity"] == "yellow", "85-94 inclusivo → amarelo"


# ---------------------------------------------------------------------------
# 3. KPI 2 — % Replanejamento
# ---------------------------------------------------------------------------


class TestKpiReplanejamento:
    def test_replanned_diferente_de_planned_conta_como_replanejado(self) -> None:
        """Fórmula KPI2: ReplannedDate IS NOT NULL AND ReplannedDate <> PlannedDate.

        Antecipação (ReplannedDate < PlannedDate) também conta — decisão CEO #18.
        Cenário: 3 planejamentos: (a) sem replanejamento, (b) replanejado adiando,
        (c) replanejado antecipando. Numerador esperado = 2 (b e c). Denom = 3.
        """
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [
            _planned(801, "2026-02-10"),
            _planned(802, "2026-02-10", replanned="2026-03-20"),  # adiamento
            _planned(803, "2026-03-15", replanned="2026-02-28"),  # antecipação
        ]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, []),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "replanejamento")
        assert kpi["numerator"] == 2
        assert kpi["denominator"] == 3
        assert kpi["value_percent"] == pytest.approx(200.0 / 3.0)

    def test_replanned_igual_a_planned_nao_conta(self) -> None:
        """Fórmula KPI2: ReplannedDate == PlannedDate é tratado como não-replanejado."""
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [
            _planned(901, "2026-02-10", replanned="2026-02-10"),
        ]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, []),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "replanejamento")
        assert kpi["numerator"] == 0
        assert kpi["denominator"] == 1

    def test_threshold_verde_quando_taxa_baixa(self) -> None:
        """Fórmula KPI2 thresholds: <=10 verde. Cenário 1/20 = 5% → verde."""
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [_planned(1000 + i, "2026-02-15") for i in range(20)]
        planned[0]["ReplannedDate"] = "2026-03-01"

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, []),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "replanejamento")
        assert kpi["value_percent"] == pytest.approx(5.0)
        assert kpi["severity"] == "green"

    def test_threshold_vermelho_acima_de_30_porcento(self) -> None:
        """Fórmula KPI2 thresholds: >30 vermelho. Cenário 4/10 = 40% → vermelho."""
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [_planned(1100 + i, "2026-02-15") for i in range(10)]
        for i in range(4):
            planned[i]["ReplannedDate"] = "2026-03-10"

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, []),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "replanejamento")
        assert kpi["value_percent"] == pytest.approx(40.0)
        assert kpi["severity"] == "red"


# ---------------------------------------------------------------------------
# 4. KPI 3 — Auditorias Vencidas (% primário + contagem secundária)
# ---------------------------------------------------------------------------


class TestKpiVencidas:
    def test_planejamento_vencido_sem_realizacao_conta(self) -> None:
        """Fórmula KPI3.

        Vencida = COALESCE(ReplannedDate, PlannedDate) < reference_date AND
        (sem match em realizadas OR match com Audit_StartDate > prazo+30d).

        Cenário: 5 planejamentos com prazo passado, 1 sem realização, 4 realizados
        dentro de 30d. value_count=1, denominador=5, %=20% → vermelho.
        """
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [_planned(1200 + i, "2026-02-01") for i in range(5)]
        executed = [_executed(1200 + i, start="2026-02-20") for i in range(4)]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, executed),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "auditorias-vencidas")
        assert kpi["value_count"] == 1
        assert kpi["denominator"] == 5
        assert kpi["value_percent"] == pytest.approx(20.0)
        assert kpi["severity"] == "red", "20% > 5% → vermelho"

    def test_realizada_alem_de_30d_torna_vencida(self) -> None:
        """Fórmula KPI3: match com Audit_StartDate > prazo+30d ainda é vencida."""
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [_planned(1300, "2026-02-01")]
        executed = [_executed(1300, start="2026-03-10")]  # 37 dias — fora da tolerância

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, executed),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "auditorias-vencidas")
        assert kpi["value_count"] == 1

    def test_threshold_verde_quando_percentual_baixo(self) -> None:
        """Fórmula KPI3 thresholds: <=2 verde. Cenário 1/100 = 1% → verde."""
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [_planned(1400 + i, "2026-02-01") for i in range(100)]
        executed = [_executed(1400 + i, start="2026-02-15") for i in range(99)]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, executed),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "auditorias-vencidas")
        assert kpi["value_percent"] == pytest.approx(1.0)
        assert kpi["severity"] == "green"

    def test_threshold_amarelo_no_intervalo_2_a_5_porcento(self) -> None:
        """Fórmula KPI3 thresholds: 2-5 amarelo. Cenário 4/100 = 4% → amarelo."""
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [_planned(1500 + i, "2026-02-01") for i in range(100)]
        executed = [_executed(1500 + i, start="2026-02-15") for i in range(96)]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, executed),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "auditorias-vencidas")
        assert kpi["value_percent"] == pytest.approx(4.0)
        assert kpi["severity"] == "yellow"


# ---------------------------------------------------------------------------
# 5. KPI 4 — Próximas 30 dias (rolling, exclui realizadas, neutral, flag IATF)
# ---------------------------------------------------------------------------


class TestKpiProximas30Dias:
    def test_conta_planejamentos_com_prazo_entre_hoje_e_hoje_mais_30(self) -> None:
        """Fórmula KPI4.

        value_count = DISTINCT planejamentos com TupleExcluded=0 e
        COALESCE(ReplannedDate, PlannedDate) BETWEEN reference_date AND
        reference_date + 30d AND sem match em realizadas (Audit_Status=2).
        """
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [
            _planned(1601, "2026-04-20"),  # dentro da janela — conta
            _planned(1602, "2026-05-10"),  # dentro da janela — conta
            _planned(1603, "2026-06-01"),  # fora da janela — não conta
            _planned(1604, "2026-04-15"),  # antes de hoje — não conta
        ]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, []),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "proximas-30-dias")
        assert kpi["value_count"] == 2

    def test_planejamento_ja_realizado_sai_da_contagem(self) -> None:
        """Fórmula KPI4: filtra realizadas (Audit_Status=2) — só lista o que falta fazer."""
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [
            _planned(1701, "2026-04-25"),
            _planned(1702, "2026-05-05"),
        ]
        executed = [_executed(1701, start="2026-04-26")]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, executed),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "proximas-30-dias")
        assert kpi["value_count"] == 1, "1701 já realizada — sai da contagem"

    def test_responsible_code_null_dispara_iatf_unassigned_flag(self) -> None:
        """Fórmula KPI4: ResponsibleCode IS NULL aciona flag IATF 16949 §7.2.3.

        unassigned_owner_count conta quantos planejamentos próximos têm
        ResponsibleCode NULL; iatf_unassigned_flag=True quando count>=1.
        """
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [
            _planned(1801, "2026-04-25", responsible=42),
            _planned(1802, "2026-05-05", responsible=None),
        ]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, []),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "proximas-30-dias")
        assert kpi["value_count"] == 2
        assert kpi["unassigned_owner_count"] == 1
        assert kpi["iatf_unassigned_flag"] is True
        assert kpi["severity"] == "neutral", "KPI 4 não tem cor"

    def test_iatf_flag_falsa_quando_todos_tem_responsavel(self) -> None:
        """Fórmula KPI4: sem nenhum NULL, flag IATF é False."""
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [
            _planned(1901, "2026-04-25", responsible=10),
            _planned(1902, "2026-05-05", responsible=20),
        ]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, []),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "proximas-30-dias")
        assert kpi["unassigned_owner_count"] == 0
        assert kpi["iatf_unassigned_flag"] is False


# ---------------------------------------------------------------------------
# 6. Edge cases adicionais — robustez contra dados sujos
# ---------------------------------------------------------------------------


class TestComputeKpisEdgeCases:
    def test_data_invalida_em_planned_date_nao_derruba_calculo(self) -> None:
        """Edge case: PlannedDate vazio/None é ignorado silenciosamente.

        Não pode derrubar a função inteira por uma linha mal formada.
        """
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [
            _planned(2001, "2026-02-01"),
            {
                "AuditingPlanningCode": 2002,
                "PlannedDate": None,
                "ReplannedDate": None,
                "TupleExcluded": 0,
                "ResponsibleCode": 1,
            },
        ]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, [_executed(2001, start="2026-02-15")]),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "aderencia-plano")
        # 2002 sem prazo → não entra em nenhum cálculo
        assert kpi["denominator"] == 1
        assert kpi["numerator"] == 1

    def test_planejamentos_duplicados_contam_uma_unica_vez(self) -> None:
        """Fórmula KPI1/2/3/4: todos usam DISTINCT AuditingPlanningCode.

        Dois rows com o mesmo Code não podem inflar denominador/numerador.
        """
        from backend.app.services.report_service import compute_auditorias_planejadas_kpis

        planned = [
            _planned(2101, "2026-02-10"),
            _planned(2101, "2026-02-10"),
        ]
        executed = [_executed(2101, start="2026-02-15")]

        payload = compute_auditorias_planejadas_kpis(
            rows=_rows(planned, executed),
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )

        kpi = next(k for k in payload["kpis"] if k["id"] == "aderencia-plano")
        assert kpi["denominator"] == 1, "DISTINCT AuditingPlanningCode evita inflação"
        assert kpi["numerator"] == 1


# ---------------------------------------------------------------------------
# 7. Endpoint HTTP — contrato da rota nova
# ---------------------------------------------------------------------------


class TestKpisEndpointContract:
    def test_endpoint_responds_200_with_payload_shape(self, client: TestClient) -> None:
        """Contrato HTTP: GET /api/v1/reports/auditorias-planejadas/kpis devolve 4 KPIs."""
        with (
            patch(
                "backend.app.api.routes.reports.fetch_audits_kpi_base_rows",
                return_value=[],
            ),
            patch(
                "backend.app.api.routes.reports.compute_auditorias_planejadas_kpis"
            ) as mock_compute,
        ):
            mock_compute.return_value = {
                "report_id": REPORT_ID,
                "reference_date": "2026-04-16",
                "period_start": "2026-01-01",
                "period_end": "2026-04-16",
                "kpis": [
                    {
                        "id": "aderencia-plano",
                        "value_percent": 92.5,
                        "numerator": 37,
                        "denominator": 40,
                        "severity": "yellow",
                        "thresholds": {"green_min": 95, "yellow_min": 85},
                    },
                    {
                        "id": "replanejamento",
                        "value_percent": 12.0,
                        "numerator": 6,
                        "denominator": 50,
                        "severity": "yellow",
                        "thresholds": {"green_max": 10, "yellow_max": 30},
                    },
                    {
                        "id": "auditorias-vencidas",
                        "value_percent": 3.0,
                        "value_count": 3,
                        "denominator": 100,
                        "severity": "yellow",
                        "thresholds": {"green_max": 2, "yellow_max": 5},
                    },
                    {
                        "id": "proximas-30-dias",
                        "value_count": 18,
                        "unassigned_owner_count": 2,
                        "iatf_unassigned_flag": True,
                        "severity": "neutral",
                        "thresholds": None,
                    },
                ],
            }

            response = client.get(KPIS_PATH)

        assert response.status_code == 200, (
            "Rota /api/v1/reports/auditorias-planejadas/kpis precisa existir (B.5)"
        )
        body = response.json()
        assert body["report_id"] == REPORT_ID
        assert [kpi["id"] for kpi in body["kpis"]] == [
            "aderencia-plano",
            "replanejamento",
            "auditorias-vencidas",
            "proximas-30-dias",
        ]

    def test_endpoint_accepts_period_filter_parameters(self, client: TestClient) -> None:
        """Contrato HTTP: aceita period_start e period_end query params validados."""
        with (
            patch(
                "backend.app.api.routes.reports.fetch_audits_kpi_base_rows",
                return_value=[],
            ),
            patch(
                "backend.app.api.routes.reports.compute_auditorias_planejadas_kpis"
            ) as mock_compute,
        ):
            mock_compute.return_value = {
                "report_id": REPORT_ID,
                "reference_date": "2026-04-16",
                "period_start": "2026-03-01",
                "period_end": "2026-03-31",
                "kpis": [],
            }

            response = client.get(
                KPIS_PATH,
                params={"period_start": "2026-03-01", "period_end": "2026-03-31"},
            )

        assert response.status_code == 200
        # Verifica que os parâmetros foram propagados ao serviço.
        call_kwargs = mock_compute.call_args.kwargs
        assert str(call_kwargs.get("period_start")) == "2026-03-01"
        assert str(call_kwargs.get("period_end")) == "2026-03-31"

    def test_endpoint_rejects_invalid_period_dates(self, client: TestClient) -> None:
        """Contrato HTTP: data inválida em query param retorna 422 (validação Pydantic)."""
        response = client.get(KPIS_PATH, params={"period_start": "not-a-date"})
        assert response.status_code == 422, (
            "FastAPI/Pydantic deve recusar period_start fora do formato ISO"
        )
