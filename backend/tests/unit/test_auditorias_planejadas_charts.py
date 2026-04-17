"""Testes unitários para as 4 funções de agregação de charts — auditorias-planejadas.

Cobre:
  P1 — _compute_aderencia_mensal (stacked bar mensal)
  P2 — _compute_replanejamento_scatter (scatter dept + histograma)
  P3 — _compute_heatmap_setor_tipo (heatmap setor × tipo)
  P7 — _compute_funil_execucao (funil 3 estágios + anotação)
  compute_auditorias_planejadas_charts (orquestrador)

Edge cases: período vazio, sentinels, AuditScore NULL, dept sem replanejadas.
"""

from __future__ import annotations

from datetime import date
from typing import Any

import pytest

from backend.app.services.report_service import (
    _classify_execution,
    _compute_aderencia_mensal,
    _compute_funil_execucao,
    _compute_heatmap_setor_tipo,
    _compute_replanejamento_scatter,
    compute_auditorias_planejadas_charts,
)

REFERENCE_DATE = date(2026, 4, 16)
PERIOD_START = date(2026, 1, 1)
PERIOD_END = date(2026, 4, 16)


# ---------------------------------------------------------------------------
# Row fixture helpers
# ---------------------------------------------------------------------------


def _row(
    code: int,
    planned: str,
    *,
    replanned: str | None = None,
    executed: str | None = None,
    responsible: int | None = 1,
    excluded: int = 0,
    dept: str = "Qualidade",
    score: float | None = None,
) -> dict[str, Any]:
    return {
        "AuditingPlanningCode": code,
        "PlannedDate": planned,
        "ReplannedDate": replanned,
        "ExecutedAt": executed,
        "TupleExcluded": excluded,
        "ResponsibleCode": responsible,
        "DepartmentDescription": dept,
        "AuditScore": score,
    }


def _sector_row(
    code: int,
    planned: str,
    *,
    replanned: str | None = None,
    executed: str | None = None,
    sector: str = "v.SC01at",
    audit_type: str = "Interna",
    score: float | None = None,
) -> dict[str, Any]:
    return {
        "AuditingPlanningCode": code,
        "PlannedDate": planned,
        "ReplannedDate": replanned,
        "ExecutedAt": executed,
        "TupleExcluded": 0,
        "ResponsibleCode": 1,
        "SectorDescription": sector,
        "TypeAuditDescription": audit_type,
        "AuditScore": score,
    }


# =========================================================================
# P1 — _compute_aderencia_mensal
# =========================================================================


class TestP1AderenciaMensal:
    def test_classifies_on_time(self) -> None:
        """Executed ON or BEFORE effective date → on_time."""
        row = _row(1, "2026-02-10", executed="2026-02-10")
        assert _classify_execution(row, REFERENCE_DATE) == "on_time"

    def test_classifies_within_30d(self) -> None:
        """Executed after effective but within 30d tolerance → within_30d."""
        row = _row(2, "2026-02-10", executed="2026-03-01")
        assert _classify_execution(row, REFERENCE_DATE) == "within_30d"

    def test_classifies_over_30d(self) -> None:
        """Executed more than 30d after effective → over_30d."""
        row = _row(3, "2026-01-10", executed="2026-03-15")
        assert _classify_execution(row, REFERENCE_DATE) == "over_30d"

    def test_classifies_overdue(self) -> None:
        """Not executed and effective < reference → overdue."""
        row = _row(4, "2026-02-10")
        assert _classify_execution(row, REFERENCE_DATE) == "overdue"

    def test_future_not_classified(self) -> None:
        """Not executed and effective >= reference → None (future)."""
        row = _row(5, "2026-05-01")
        assert _classify_execution(row, REFERENCE_DATE) is None

    def test_monthly_buckets_correct(self) -> None:
        """Rows are bucketed by effective date month (YYYY-MM)."""
        rows = [
            _row(1, "2026-01-15", executed="2026-01-15"),
            _row(2, "2026-01-20", executed="2026-02-10"),
            _row(3, "2026-02-10"),
            _row(4, "2026-03-05", executed="2026-03-05"),
        ]
        result = _compute_aderencia_mensal(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        months = [b["month"] for b in result["buckets"]]
        assert months == ["2026-01", "2026-02", "2026-03"]

    def test_segment_counts_per_month(self) -> None:
        """Each month bucket has correct segment counts."""
        rows = [
            _row(1, "2026-02-01", executed="2026-02-01"),  # on_time
            _row(2, "2026-02-01", executed="2026-02-20"),  # within_30d
            _row(3, "2026-02-01", executed="2026-04-01"),  # over_30d
            _row(4, "2026-02-15"),  # overdue
        ]
        result = _compute_aderencia_mensal(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        feb = next(b for b in result["buckets"] if b["month"] == "2026-02")
        assert feb["on_time"] == 1
        assert feb["within_30d"] == 1
        assert feb["over_30d"] == 1
        assert feb["overdue"] == 1

    def test_adherence_pct_formula(self) -> None:
        """adherence_pct = (on_time + within_30d) / total × 100."""
        rows = [
            _row(1, "2026-03-01", executed="2026-03-01"),  # on_time
            _row(2, "2026-03-01", executed="2026-03-20"),  # within_30d
            _row(3, "2026-03-01"),  # overdue
            _row(4, "2026-03-01"),  # overdue
        ]
        result = _compute_aderencia_mensal(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        mar = next(b for b in result["buckets"] if b["month"] == "2026-03")
        assert mar["adherence_pct"] == pytest.approx(50.0)

    def test_empty_period_no_buckets(self) -> None:
        """No rows in period → empty buckets list."""
        rows = [_row(1, "2025-06-01", executed="2025-06-01")]
        result = _compute_aderencia_mensal(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["buckets"] == []

    def test_month_without_data_absent(self) -> None:
        """Months without data are not forced to 0 — they are absent."""
        rows = [_row(1, "2026-01-15", executed="2026-01-15")]
        result = _compute_aderencia_mensal(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        months = [b["month"] for b in result["buckets"]]
        assert "2026-02" not in months

    def test_target_pct_is_95(self) -> None:
        result = _compute_aderencia_mensal([], REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["target_pct"] == 95.0

    def test_insight_green_all_above_85(self) -> None:
        rows = [_row(1, "2026-03-01", executed="2026-03-01")]
        result = _compute_aderencia_mensal(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["insight_lead"]["severity"] == "green"

    def test_insight_yellow_one_month_below_85(self) -> None:
        rows = [_row(i, "2026-03-01") for i in range(1, 11)]
        rows[0]["ExecutedAt"] = "2026-03-01"  # 1/10 = 10% — below 85%
        result = _compute_aderencia_mensal(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["insight_lead"]["severity"] == "yellow"

    def test_insight_red_three_months_below_85(self) -> None:
        rows = []
        for month_num in [1, 2, 3]:
            for i in range(10):
                code = month_num * 100 + i
                rows.append(_row(code, f"2026-0{month_num}-15"))
        result = _compute_aderencia_mensal(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["insight_lead"]["severity"] == "red"

    def test_replanned_uses_effective_date(self) -> None:
        """When replanned, effective date (replanned) determines month bucket."""
        row = _row(1, "2026-01-15", replanned="2026-02-20", executed="2026-02-20")
        result = _compute_aderencia_mensal([row], REFERENCE_DATE, PERIOD_START, PERIOD_END)
        months = [b["month"] for b in result["buckets"]]
        assert "2026-02" in months
        assert "2026-01" not in months


# =========================================================================
# P2 — _compute_replanejamento_scatter
# =========================================================================


class TestP2ReplanejamentoScatter:
    def test_replan_pct_per_dept(self) -> None:
        """% replanned per department calculated correctly."""
        rows = [
            _row(1, "2026-02-01", dept="Qualidade"),
            _row(2, "2026-02-01", replanned="2026-02-15", dept="Qualidade"),
        ]
        result = _compute_replanejamento_scatter(rows, PERIOD_START, PERIOD_END)
        dept = result["departments"][0]
        assert dept["name"] == "Qualidade"
        assert dept["replan_pct"] == pytest.approx(50.0)

    def test_avg_displacement_excludes_anticipated(self) -> None:
        """Average displacement only counts postponed (positive delta)."""
        rows = [
            _row(1, "2026-02-01", replanned="2026-02-11", dept="Prod"),  # +10d
            _row(2, "2026-02-01", replanned="2026-01-25", dept="Prod"),  # -7d anticipated
            _row(3, "2026-02-01", dept="Prod"),  # no replan
        ]
        result = _compute_replanejamento_scatter(rows, PERIOD_START, PERIOD_END)
        dept = next(d for d in result["departments"] if d["name"] == "Prod")
        assert dept["avg_displacement_days"] == pytest.approx(10.0)

    def test_anticipated_in_histogram(self) -> None:
        """Anticipated replans appear in separate 'anticipated' histogram bin."""
        rows = [
            _row(1, "2026-02-01", replanned="2026-01-25", dept="Prod"),
        ]
        result = _compute_replanejamento_scatter(rows, PERIOD_START, PERIOD_END)
        anticipated_bin = next(b for b in result["histogram"] if b["range"] == "anticipated")
        assert anticipated_bin["count"] == 1

    def test_histogram_bins(self) -> None:
        """All 6 histogram bins are present (5 ranges + anticipated)."""
        result = _compute_replanejamento_scatter([], PERIOD_START, PERIOD_END)
        ranges = [b["range"] for b in result["histogram"]]
        assert ranges == ["0-7", "8-15", "16-30", "31-60", "61+", "anticipated"]

    def test_quadrant_optimal(self) -> None:
        """Dept with <=10% replan and <=15d avg → optimal."""
        rows = [_row(i, "2026-02-01", dept="Q") for i in range(1, 21)]
        rows[0]["ReplannedDate"] = "2026-02-05"  # 1/20 = 5%, +4d
        result = _compute_replanejamento_scatter(rows, PERIOD_START, PERIOD_END)
        dept = result["departments"][0]
        assert dept["quadrant"] == "optimal"

    def test_quadrant_critical(self) -> None:
        """Dept with >30% replan → critical regardless of displacement."""
        rows = [
            _row(1, "2026-02-01", replanned="2026-02-05", dept="X"),
            _row(2, "2026-02-01", replanned="2026-02-10", dept="X"),
            _row(3, "2026-02-01", dept="X"),
        ]
        result = _compute_replanejamento_scatter(rows, PERIOD_START, PERIOD_END)
        dept = result["departments"][0]
        assert dept["quadrant"] == "critical"

    def test_quadrant_attention(self) -> None:
        """Dept with 10-30% replan and >15d avg → attention."""
        rows = [_row(i, "2026-02-01", dept="Z") for i in range(1, 6)]
        rows[0]["ReplannedDate"] = "2026-02-25"  # 1/5 = 20%, +24d
        result = _compute_replanejamento_scatter(rows, PERIOD_START, PERIOD_END)
        dept = result["departments"][0]
        assert dept["quadrant"] == "attention"

    def test_quadrant_moderate(self) -> None:
        """Dept with 10-30% replan and <=15d avg → moderate."""
        rows = [_row(i, "2026-02-01", dept="Z") for i in range(1, 6)]
        rows[0]["ReplannedDate"] = "2026-02-05"  # 1/5 = 20%, +4d
        result = _compute_replanejamento_scatter(rows, PERIOD_START, PERIOD_END)
        dept = result["departments"][0]
        assert dept["quadrant"] == "moderate"

    def test_quadrant_watch(self) -> None:
        """Dept with <=10% replan and >15d avg → watch."""
        rows = [_row(i, "2026-02-01", dept="Z") for i in range(1, 11)]
        rows[0]["ReplannedDate"] = "2026-03-01"  # 1/10 = 10%, +28d
        result = _compute_replanejamento_scatter(rows, PERIOD_START, PERIOD_END)
        dept = result["departments"][0]
        assert dept["quadrant"] == "watch"

    def test_dept_no_replanned_optimal(self) -> None:
        """Dept with zero replans → 0%/0d → optimal quadrant."""
        rows = [_row(1, "2026-02-01", dept="Clean")]
        result = _compute_replanejamento_scatter(rows, PERIOD_START, PERIOD_END)
        dept = result["departments"][0]
        assert dept["replan_pct"] == pytest.approx(0.0)
        assert dept["avg_displacement_days"] == pytest.approx(0.0)
        assert dept["quadrant"] == "optimal"

    def test_insight_red_when_critical_dept(self) -> None:
        rows = [
            _row(1, "2026-02-01", replanned="2026-03-01", dept="Bad"),
            _row(2, "2026-02-01", replanned="2026-03-01", dept="Bad"),
        ]
        result = _compute_replanejamento_scatter(rows, PERIOD_START, PERIOD_END)
        assert result["insight_lead"]["severity"] == "red"
        assert "Bad" in result["insight_lead"]["text"]

    def test_insight_green_all_optimal(self) -> None:
        rows = [_row(1, "2026-02-01", dept="Good")]
        result = _compute_replanejamento_scatter(rows, PERIOD_START, PERIOD_END)
        assert result["insight_lead"]["severity"] == "green"

    def test_empty_period(self) -> None:
        result = _compute_replanejamento_scatter([], PERIOD_START, PERIOD_END)
        assert result["departments"] == []

    def test_decomposed_pct(self) -> None:
        """anticipated_pct and postponed_pct are decomposed correctly."""
        rows = [
            _row(1, "2026-02-01", replanned="2026-02-10", dept="D"),  # +9d
            _row(2, "2026-02-01", replanned="2026-01-20", dept="D"),  # -12d anticipated
            _row(3, "2026-02-01", dept="D"),
        ]
        result = _compute_replanejamento_scatter(rows, PERIOD_START, PERIOD_END)
        dept = result["departments"][0]
        assert dept["postponed_pct"] == pytest.approx(100 / 3, rel=0.1)
        assert dept["anticipated_pct"] == pytest.approx(100 / 3, rel=0.1)


# =========================================================================
# P3 — _compute_heatmap_setor_tipo
# =========================================================================


class TestP3HeatmapSetorTipo:
    def test_cell_count_distinct_plans(self) -> None:
        """COUNT DISTINCT AuditingPlanningCode per (sector, type)."""
        rows = [
            _sector_row(1, "2026-03-01", sector="S1", audit_type="Int"),
            _sector_row(1, "2026-03-01", sector="S1", audit_type="Int"),  # dup
            _sector_row(2, "2026-03-01", sector="S1", audit_type="Int"),
        ]
        result = _compute_heatmap_setor_tipo(rows, REFERENCE_DATE, 12)
        cell = result["cells"][0]
        assert cell["sector"] == "S1"
        assert cell["audit_type"] == "Int"
        assert cell["count"] == 2

    def test_sample_sufficient_threshold(self) -> None:
        """sample_sufficient = True when count >= 5."""
        rows = [
            _sector_row(i, "2026-03-01", sector="S1", audit_type="A", executed="2026-03-01")
            for i in range(1, 6)
        ]
        result = _compute_heatmap_setor_tipo(rows, REFERENCE_DATE, 12)
        cell = result["cells"][0]
        assert cell["sample_sufficient"] is True
        assert cell["adherence_pct"] is not None

    def test_sample_insufficient_no_pct(self) -> None:
        """When count < 5, adherence_pct is None."""
        rows = [
            _sector_row(i, "2026-03-01", sector="S1", audit_type="A", executed="2026-03-01")
            for i in range(1, 4)
        ]
        result = _compute_heatmap_setor_tipo(rows, REFERENCE_DATE, 12)
        cell = result["cells"][0]
        assert cell["sample_sufficient"] is False
        assert cell["adherence_pct"] is None

    def test_adherence_pct_correct(self) -> None:
        """adherence_pct = adherent / count × 100 when sample sufficient."""
        rows = [
            _sector_row(1, "2026-03-01", sector="S", audit_type="T", executed="2026-03-01"),
            _sector_row(2, "2026-03-01", sector="S", audit_type="T", executed="2026-03-01"),
            _sector_row(3, "2026-03-01", sector="S", audit_type="T"),  # not executed
            _sector_row(4, "2026-03-01", sector="S", audit_type="T"),
            _sector_row(5, "2026-03-01", sector="S", audit_type="T"),
        ]
        result = _compute_heatmap_setor_tipo(rows, REFERENCE_DATE, 12)
        cell = result["cells"][0]
        assert cell["adherence_pct"] == pytest.approx(40.0)

    def test_period_12_vs_36(self) -> None:
        """period_months=36 includes older rows; period_months=12 excludes them."""
        old_row = _sector_row(1, "2024-06-01", sector="S", audit_type="T", executed="2024-06-01")
        recent_row = _sector_row(2, "2026-03-01", sector="S", audit_type="T", executed="2026-03-01")

        result_12 = _compute_heatmap_setor_tipo([old_row, recent_row], REFERENCE_DATE, 12)
        result_36 = _compute_heatmap_setor_tipo([old_row, recent_row], REFERENCE_DATE, 36)

        counts_12 = sum(c["count"] for c in result_12["cells"])
        counts_36 = sum(c["count"] for c in result_36["cells"])
        assert counts_36 >= counts_12

    def test_empty_period(self) -> None:
        result = _compute_heatmap_setor_tipo([], REFERENCE_DATE, 12)
        assert result["cells"] == []

    def test_period_months_in_output(self) -> None:
        result = _compute_heatmap_setor_tipo([], REFERENCE_DATE, 36)
        assert result["period_months"] == 36

    def test_insight_red_low_adherence(self) -> None:
        rows = [_sector_row(i, "2026-03-01", sector="Bad", audit_type="T") for i in range(1, 8)]
        result = _compute_heatmap_setor_tipo(rows, REFERENCE_DATE, 12)
        assert result["insight_lead"]["severity"] == "red"
        assert "Bad" in result["insight_lead"]["text"]

    def test_insight_green_no_low_cells(self) -> None:
        rows = [
            _sector_row(i, "2026-03-01", sector="Good", audit_type="T", executed="2026-03-01")
            for i in range(1, 6)
        ]
        result = _compute_heatmap_setor_tipo(rows, REFERENCE_DATE, 12)
        assert result["insight_lead"]["severity"] == "green"


# =========================================================================
# P7 — _compute_funil_execucao
# =========================================================================


class TestP7FunilExecucao:
    def test_three_stages(self) -> None:
        result = _compute_funil_execucao([], REFERENCE_DATE, PERIOD_START, PERIOD_END)
        stage_ids = [s["id"] for s in result["stages"]]
        assert stage_ids == ["planejadas", "realizadas-30d", "score-gte-70"]

    def test_planejadas_count(self) -> None:
        """Planejadas = rows with effective in period AND effective <= ref."""
        rows = [
            _row(1, "2026-02-01"),
            _row(2, "2026-03-01"),
            _row(3, "2026-05-01"),  # future — excluded
        ]
        result = _compute_funil_execucao(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["stages"][0]["count"] == 2

    def test_realizadas_30d_only_within_tolerance(self) -> None:
        """Only rows executed within 30d tolerance enter stage 2."""
        rows = [
            _row(1, "2026-02-01", executed="2026-02-01"),  # on_time ✓
            _row(2, "2026-02-01", executed="2026-02-20"),  # within 30d ✓
            _row(3, "2026-01-01", executed="2026-03-15"),  # >30d ✗
            _row(4, "2026-03-01"),  # not executed ✗
        ]
        result = _compute_funil_execucao(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["stages"][1]["count"] == 2

    def test_over_30d_excluded_from_stage3(self) -> None:
        """Executed >30d don't enter realizadas-30d (aligned with KPI 1)."""
        rows = [
            _row(1, "2026-01-10", executed="2026-03-15", score=85.0),
        ]
        result = _compute_funil_execucao(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["stages"][1]["count"] == 0
        assert result["stages"][2]["count"] == 0

    def test_score_gte_70_vda_b(self) -> None:
        """Only realizadas ≤30d with AuditScore ≥ 70 enter stage 3."""
        rows = [
            _row(1, "2026-02-01", executed="2026-02-01", score=85.0),  # ≥70 ✓
            _row(2, "2026-02-01", executed="2026-02-01", score=65.0),  # <70 ✗
            _row(3, "2026-02-01", executed="2026-02-01", score=70.0),  # =70 ✓
        ]
        result = _compute_funil_execucao(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["stages"][2]["count"] == 2

    def test_score_null_excluded(self) -> None:
        """AuditScore NULL → excluded from stage 3."""
        rows = [
            _row(1, "2026-02-01", executed="2026-02-01", score=None),
        ]
        result = _compute_funil_execucao(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["stages"][2]["count"] == 0

    def test_conversion_pct(self) -> None:
        """conversion_pct between stages."""
        rows = [
            _row(1, "2026-02-01", executed="2026-02-01", score=80.0),
            _row(2, "2026-02-01"),
        ]
        result = _compute_funil_execucao(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["stages"][1]["conversion_pct"] == pytest.approx(50.0)
        assert result["stages"][2]["conversion_pct"] == pytest.approx(100.0)

    def test_annotation_replanned_count(self) -> None:
        rows = [
            _row(1, "2026-02-01", replanned="2026-02-15"),
            _row(2, "2026-02-01"),
        ]
        result = _compute_funil_execucao(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["annotation"]["replanned_count"] == 1

    def test_annotation_out_of_tolerance(self) -> None:
        rows = [
            _row(1, "2026-01-01", executed="2026-03-15"),  # >30d
        ]
        result = _compute_funil_execucao(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["annotation"]["out_of_tolerance_count"] == 1

    def test_empty_period(self) -> None:
        result = _compute_funil_execucao([], REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["stages"][0]["count"] == 0
        assert result["stages"][1]["count"] == 0
        assert result["stages"][2]["count"] == 0

    def test_insight_red_zero_realized(self) -> None:
        rows = [_row(1, "2026-02-01"), _row(2, "2026-03-01")]
        result = _compute_funil_execucao(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["insight_lead"]["severity"] == "red"

    def test_insight_yellow_low_score_rate(self) -> None:
        rows = [
            _row(1, "2026-02-01", executed="2026-02-01", score=50.0),
            _row(2, "2026-02-01", executed="2026-02-01", score=50.0),
            _row(3, "2026-02-01", executed="2026-02-01", score=50.0),
        ]
        result = _compute_funil_execucao(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["insight_lead"]["severity"] == "yellow"

    def test_insight_green_healthy(self) -> None:
        rows = [
            _row(1, "2026-02-01", executed="2026-02-01", score=85.0),
            _row(2, "2026-02-01", executed="2026-02-01", score=90.0),
        ]
        result = _compute_funil_execucao(rows, REFERENCE_DATE, PERIOD_START, PERIOD_END)
        assert result["insight_lead"]["severity"] == "green"


# =========================================================================
# Edge cases — sentinel dates
# =========================================================================


class TestSentinelDefense:
    def test_sentinel_planned_date_excluded(self) -> None:
        """Row with PlannedDate=1000-01-01 sentinel should be treated as NULL."""
        row = _row(1, "1000-01-01")
        assert _classify_execution(row, REFERENCE_DATE) is None

    def test_sentinel_replanned_ignored(self) -> None:
        """Sentinel ReplannedDate treated as no replan."""
        row = _row(1, "2026-02-01", replanned="1000-01-01")
        result = _compute_aderencia_mensal([row], REFERENCE_DATE, PERIOD_START, PERIOD_END)
        feb = next((b for b in result["buckets"] if b["month"] == "2026-02"), None)
        assert feb is not None


# =========================================================================
# Orchestrator — compute_auditorias_planejadas_charts
# =========================================================================


class TestComputeCharts:
    def test_returns_all_four_charts(self) -> None:
        result = compute_auditorias_planejadas_charts(
            rows=[],
            by_sector_rows=[],
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )
        assert result["report_id"] == "auditorias-planejadas"
        assert "aderencia-mensal" in result["charts"]
        assert "replanejamento-scatter" in result["charts"]
        assert "heatmap-setor-tipo" in result["charts"]
        assert "funil-execucao" in result["charts"]

    def test_metadata_fields(self) -> None:
        result = compute_auditorias_planejadas_charts(
            rows=[],
            by_sector_rows=[],
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )
        assert result["reference_date"] == "2026-04-16"
        assert result["period_start"] == "2026-01-01"
        assert result["period_end"] == "2026-04-16"

    def test_period_months_param(self) -> None:
        result = compute_auditorias_planejadas_charts(
            rows=[],
            by_sector_rows=[],
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
            period_months=36,
        )
        assert result["charts"]["heatmap-setor-tipo"]["period_months"] == 36

    def test_soft_deleted_rows_excluded(self) -> None:
        """TupleExcluded=1 rows are filtered by _distinct_active_rows."""
        rows = [
            _row(1, "2026-02-01", excluded=1),
            _row(2, "2026-02-01"),
        ]
        result = compute_auditorias_planejadas_charts(
            rows=rows,
            by_sector_rows=[],
            reference_date=REFERENCE_DATE,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )
        funil = result["charts"]["funil-execucao"]
        assert funil["stages"][0]["count"] == 1
