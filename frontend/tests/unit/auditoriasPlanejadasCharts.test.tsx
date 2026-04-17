/**
 * TDD — testes dos 4 charts executivos de `auditorias-planejadas`.
 * Definições CONGELADAS pelo CEO #33 + Pesquisador #32.
 *
 * Charts cobertos:
 *   P1 — Aderência ao Plano (stacked bar + linha + guia 95%)
 *   P2 — Replanejamento por Departamento (scatter + histograma)
 *   P3 — Cobertura de Auditoria — Setor × Tipo (heatmap Cividis)
 *   P7 — Funil de Execução do Programa (4 barras horizontais)
 *
 * Cobertura:
 *   1. Cada chart renderiza com data-testid adequado
 *   2. Estado vazio renderiza mensagem correta (sem crash)
 *   3. Títulos frozen PT-BR e EN-US presentes
 *   4. Insight-lead renderiza (fallback/default)
 *   5. P1: 4 segmentos + linha + guia 95%
 *   6. P2: scatter com 4 quadrantes + histograma + label direto em críticos
 *   7. P3: heatmap + toggle período (12m/3y) + célula vazia destacada
 *   8. P7: 4 barras + anotação replanejadas + nota rodapé + label VDA
 *   9. i18n: chaves PT/EN para todos os títulos frozen
 *
 * Os testes falham legitimamente até que Fase C.6 (frontend) implemente
 * os componentes de chart especializados para auditorias-planejadas.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";

import { App } from "../../src/App";
import { getReportSemanticView } from "../../src/lib/reportSemantics";
import type {
  AderenciaMensalChart,
  ReplanejamentoScatterChart,
  HeatmapSetorTipoChart,
  FunilExecucaoChart,
  ChartsResponse,
} from "../../src/components/charts/types";

// ---------------------------------------------------------------------------
// Chart data-testid convention
// ---------------------------------------------------------------------------
const CHART_TESTIDS = {
  aderencia: "chart-aderencia",
  replanejamento: "chart-replanejamento",
  heatmap: "chart-heatmap",
  funil: "chart-funil",
} as const;

// ---------------------------------------------------------------------------
// Frozen titles (CEO #33)
// ---------------------------------------------------------------------------
const TITLES_PT = {
  aderencia: "Aderência ao Plano — evolução mensal",
  replanejamento: "Replanejamento por Departamento",
  heatmap: "Cobertura de Auditoria — Setor × Tipo",
  funil: "Funil de Execução do Programa",
} as const;

const TITLES_EN = {
  aderencia: "Plan Adherence — monthly evolution",
  replanejamento: "Replanning by Department",
  heatmap: "Audit Coverage — Sector × Type",
  funil: "Program Execution Funnel",
} as const;

// ---------------------------------------------------------------------------
// Frozen empty-state message (CEO #33, regra geral)
// ---------------------------------------------------------------------------
const EMPTY_STATE_PT = "Sem dados no período selecionado";
const EMPTY_STATE_HINT_PT = "amplie o período ou remova filtros";

// ---------------------------------------------------------------------------
// Mock fetch + render helpers (same pattern as KPI test)
// ---------------------------------------------------------------------------
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
  fetchMock.mockReset();
  localStorage.clear();
});

const REPORT_ID = "auditorias-planejadas";

// ---------------------------------------------------------------------------
// Sample chart data fixtures (mirrors backend Pydantic schemas)
// ---------------------------------------------------------------------------
const SAMPLE_ADERENCIA: AderenciaMensalChart = {
  buckets: [
    { month: "2026-01", on_time: 5, within_30d: 3, over_30d: 1, overdue: 40, adherence_pct: 16.3 },
    { month: "2026-02", on_time: 4, within_30d: 2, over_30d: 0, overdue: 35, adherence_pct: 14.6 },
    { month: "2026-03", on_time: 5, within_30d: 0, over_30d: 0, overdue: 30, adherence_pct: 14.3 },
  ],
  target_pct: 95.0,
  insight_lead: { severity: "red", text: "14% aderência — muito abaixo do alvo" },
};

const SAMPLE_REPLANEJAMENTO: ReplanejamentoScatterChart = {
  departments: [
    { name: "Qualidade", replan_pct: 5.0, avg_displacement_days: 3, volume: 40, quadrant: "low-low", anticipated_pct: 1.0, postponed_pct: 4.0 },
    { name: "Processos", replan_pct: 25.0, avg_displacement_days: 20, volume: 30, quadrant: "high-high", anticipated_pct: 5.0, postponed_pct: 20.0 },
    { name: "Produção", replan_pct: 45.0, avg_displacement_days: 35, volume: 20, quadrant: "high-high", anticipated_pct: 2.0, postponed_pct: 43.0 },
  ],
  histogram: [
    { range: "0-7", count: 15 },
    { range: "8-15", count: 10 },
    { range: "16-30", count: 8 },
    { range: "31-60", count: 5 },
    { range: ">60", count: 2 },
    { range: "anticipated", count: 3 },
  ],
  insight_lead: { severity: "yellow", text: "2 departamentos em zona crítica de replanejamento" },
};

const SAMPLE_HEATMAP: HeatmapSetorTipoChart = {
  period_months: 12,
  cells: [
    { sector: "v.SC01at", audit_type: "Interna", count: 12, adherence_pct: 85.0, sample_sufficient: true },
    { sector: "v.SC01at", audit_type: "Externa", count: 3, adherence_pct: null, sample_sufficient: false },
    { sector: "v.SC02at", audit_type: "Interna", count: 8, adherence_pct: 90.0, sample_sufficient: true },
    { sector: "v.SC02at", audit_type: "Externa", count: 0, adherence_pct: null, sample_sufficient: false },
  ],
  insight_lead: { severity: "yellow", text: "1 lacuna de cobertura identificada" },
};

const SAMPLE_FUNIL: FunilExecucaoChart = {
  stages: [
    { id: "planejadas", count: 218, label: "Planejadas", conversion_pct: null },
    { id: "replanejadas", count: 21, label: "Replanejadas", conversion_pct: 9.6 },
    { id: "realizadas-30d", count: 14, label: "Realizadas (≤30d)", conversion_pct: 6.4 },
    { id: "score-gte-70", count: 10, label: "Score ≥ 70 (VDA B ou superior)", conversion_pct: 4.6 },
  ],
  annotation: { replanned_count: 21, out_of_tolerance_count: 5 },
  insight_lead: { severity: "red", text: "Apenas 6.4% das auditorias concluídas no prazo" },
};

const EMPTY_ADERENCIA: AderenciaMensalChart = {
  buckets: [],
  target_pct: 95.0,
  insight_lead: { severity: "neutral", text: "" },
};

const EMPTY_REPLANEJAMENTO: ReplanejamentoScatterChart = {
  departments: [],
  histogram: [],
  insight_lead: { severity: "neutral", text: "" },
};

const EMPTY_HEATMAP: HeatmapSetorTipoChart = {
  period_months: 12,
  cells: [],
  insight_lead: { severity: "neutral", text: "" },
};

const EMPTY_FUNIL: FunilExecucaoChart = {
  stages: [],
  annotation: { replanned_count: 0, out_of_tolerance_count: 0 },
  insight_lead: { severity: "neutral", text: "" },
};

function buildChartsResponse(charts: ChartsResponse["charts"]): Response {
  const body: ChartsResponse = {
    report_id: REPORT_ID,
    reference_date: "2026-04-16",
    period_start: "2026-01-16",
    period_end: "2026-04-16",
    charts,
  };
  return new Response(JSON.stringify(body), { status: 200 });
}

function buildCatalogResponse(): Response {
  return new Response(
    JSON.stringify({
      reports: [
        {
          report_id: REPORT_ID,
          title: "Auditorias Planejadas",
          sql_file_name: "auditorias_planejadas.sql",
          status: "available",
          blocked_reason: null,
        },
      ],
    }),
    { status: 200 },
  );
}

function buildReportRowsResponse(rows: Record<string, string | number | null>[] = []): Response {
  return new Response(
    JSON.stringify({
      report_id: REPORT_ID,
      title: "Auditorias Planejadas",
      limit: 120,
      offset: 0,
      row_count: rows.length,
      rows,
    }),
    { status: 200 },
  );
}

function buildKpisResponse(): Response {
  return new Response(
    JSON.stringify({
      report_id: REPORT_ID,
      reference_date: "2026-04-16",
      period_start: "2026-01-16",
      period_end: "2026-04-16",
      kpis: [
        { id: "aderencia-plano", value_percent: 6.42, numerator: 14, denominator: 218, severity: "red" },
        { id: "replanejamento", value_percent: 9.63, numerator: 21, denominator: 218, severity: "green" },
        { id: "auditorias-vencidas", value_percent: 91.74, value_count: 200, denominator: 218, severity: "red" },
        { id: "proximas-30-dias", value_count: 7, unassigned_owner_count: 0, iatf_unassigned_flag: false, severity: "neutral" },
      ],
    }),
    { status: 200 },
  );
}

// =========================================================================
// 1. Camada semântica: charts definidos no reportSemantics
// =========================================================================

describe("auditorias-planejadas chart semantic layer (Fase C.3 contract)", () => {
  it("define os 4 charts executivos no createDefinition", () => {
    const view = getReportSemanticView(REPORT_ID, [], "pt-BR");
    const chartIds = view.charts.map((c) => c.id);

    expect(chartIds).toContain("aderencia-mensal");
    expect(chartIds).toContain("replanejamento-scatter");
    expect(chartIds).toContain("heatmap-setor-tipo");
    expect(chartIds).toContain("funil-execucao");
  });

  it("títulos PT-BR frozen pelo CEO #33", () => {
    const view = getReportSemanticView(REPORT_ID, [], "pt-BR");
    const titles = Object.fromEntries(view.charts.map((c) => [c.id, c.title]));

    expect(titles["aderencia-mensal"]).toBe(TITLES_PT.aderencia);
    expect(titles["replanejamento-scatter"]).toBe(TITLES_PT.replanejamento);
    expect(titles["heatmap-setor-tipo"]).toBe(TITLES_PT.heatmap);
    expect(titles["funil-execucao"]).toBe(TITLES_PT.funil);
  });

  it("títulos EN-US frozen pelo CEO #33", () => {
    const view = getReportSemanticView(REPORT_ID, [], "en-US");
    const titles = Object.fromEntries(view.charts.map((c) => [c.id, c.title]));

    expect(titles["aderencia-mensal"]).toBe(TITLES_EN.aderencia);
    expect(titles["replanejamento-scatter"]).toBe(TITLES_EN.replanejamento);
    expect(titles["heatmap-setor-tipo"]).toBe(TITLES_EN.heatmap);
    expect(titles["funil-execucao"]).toBe(TITLES_EN.funil);
  });
});

// =========================================================================
// 2. P1 — Aderência ao Plano (stacked bar + linha + guia 95%)
// =========================================================================

describe("P1 — Aderência ao Plano chart rendering", () => {
  it("renderiza o container com data-testid correto", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.aderencia);
    expect(container).toBeInTheDocument();
  });

  it("exibe o título frozen PT-BR", async () => {
    await renderChartContainer(CHART_TESTIDS.aderencia);
    expect(screen.getByText(TITLES_PT.aderencia)).toBeInTheDocument();
  });

  it("renderiza 4 segmentos de barra empilhada (no prazo, ≤30d, >30d, vencida)", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.aderencia);
    const segments = within(container).getAllByTestId(/^bar-segment-/);
    const segmentTypes = segments.map((s) => s.getAttribute("data-segment-type"));

    expect(segmentTypes).toContain("on-time");
    expect(segmentTypes).toContain("within-30d");
    expect(segmentTypes).toContain("over-30d");
    expect(segmentTypes).toContain("overdue");
  });

  it("renderiza linha de % aderência ACIMA das barras", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.aderencia);
    const line = within(container).getByTestId("adherence-line");
    expect(line).toBeInTheDocument();
    expect(line.tagName.toLowerCase()).toMatch(/path|line|polyline/);
  });

  it("renderiza guia 'Meta IATF 95%' rotulada", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.aderencia);
    const guide = within(container).getByTestId("target-guide-95");
    expect(guide).toBeInTheDocument();
    expect(within(container).getByText(/Meta IATF 95%/i)).toBeInTheDocument();
  });

  it("renderiza insight-lead abaixo do título", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.aderencia);
    const insight = within(container).getByTestId("insight-lead");
    expect(insight).toBeInTheDocument();
  });

  it("exibe estado vazio correto quando sem dados", async () => {
    const container = await renderChartContainerEmpty(CHART_TESTIDS.aderencia);
    expect(within(container).getByText(EMPTY_STATE_PT)).toBeInTheDocument();
    expect(within(container).getByText(new RegExp(EMPTY_STATE_HINT_PT))).toBeInTheDocument();
  });
});

// =========================================================================
// 3. P2 — Replanejamento por Departamento (scatter + histograma)
// =========================================================================

describe("P2 — Replanejamento por Departamento chart rendering", () => {
  it("renderiza o container com data-testid correto", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.replanejamento);
    expect(container).toBeInTheDocument();
  });

  it("exibe o título frozen PT-BR", async () => {
    await renderChartContainer(CHART_TESTIDS.replanejamento);
    expect(screen.getByText(TITLES_PT.replanejamento)).toBeInTheDocument();
  });

  it("renderiza scatter com 4 labels de quadrante", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.replanejamento);
    const quadrants = within(container).getAllByTestId(/^quadrant-label-/);
    expect(quadrants).toHaveLength(4);
  });

  it("eixos de quadrante em X=10%/30% e Y=15d", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.replanejamento);
    const xAxis10 = within(container).getByTestId("quadrant-axis-x-10");
    const xAxis30 = within(container).getByTestId("quadrant-axis-x-30");
    const yAxis15 = within(container).getByTestId("quadrant-axis-y-15");

    expect(xAxis10).toBeInTheDocument();
    expect(xAxis30).toBeInTheDocument();
    expect(yAxis15).toBeInTheDocument();
  });

  it("pontos no quadrante CRÍTICO exibem label direto do departamento (sem hover)", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.replanejamento);
    const criticalPoints = within(container).getAllByTestId(/^scatter-point-critical-/);
    expect(criticalPoints.length).toBeGreaterThan(0);

    for (const point of criticalPoints) {
      const label = point.getAttribute("data-dept-label");
      expect(label).toBeTruthy();
    }
  });

  it("renderiza histograma de faixas de deslocamento", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.replanejamento);
    const histogram = within(container).getByTestId("replan-histogram");
    expect(histogram).toBeInTheDocument();

    const bars = within(histogram).getAllByTestId(/^histogram-bar-/);
    const ranges = bars.map((b) => b.getAttribute("data-range"));
    expect(ranges).toContain("0-7");
    expect(ranges).toContain("8-15");
    expect(ranges).toContain("16-30");
    expect(ranges).toContain("31-60");
    expect(ranges).toContain(">60");
    expect(ranges).toContain("anticipated");
  });

  it("tooltip decomposto mostra antecipadas e adiadas", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.replanejamento);
    const user = userEvent.setup();
    const points = within(container).getAllByTestId(/^scatter-point-/);

    if (points.length > 0) {
      await user.hover(points[0]);
      const tooltip = await screen.findByTestId("chart-tooltip");
      const text = tooltip.textContent ?? "";
      expect(text).toMatch(/antecipadas?:?\s+\d+(\.\d+)?%/i);
      expect(text).toMatch(/adiadas?:?\s+\d+(\.\d+)?%/i);
    }
  });

  it("exibe estado vazio correto quando sem dados", async () => {
    const container = await renderChartContainerEmpty(CHART_TESTIDS.replanejamento);
    expect(within(container).getByText(EMPTY_STATE_PT)).toBeInTheDocument();
  });
});

// =========================================================================
// 4. P3 — Heatmap Cobertura de Auditoria — Setor × Tipo
// =========================================================================

describe("P3 — Heatmap Setor × Tipo chart rendering", () => {
  it("renderiza o container com data-testid correto", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.heatmap);
    expect(container).toBeInTheDocument();
  });

  it("exibe o título frozen PT-BR", async () => {
    await renderChartContainer(CHART_TESTIDS.heatmap);
    expect(screen.getByText(TITLES_PT.heatmap)).toBeInTheDocument();
  });

  it("renderiza toggle de período com labels normativos", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.heatmap);
    const toggle12m = within(container).getByTestId("heatmap-toggle-12m");
    const toggle3y = within(container).getByTestId("heatmap-toggle-3y");

    expect(toggle12m).toBeInTheDocument();
    expect(toggle3y).toBeInTheDocument();
    expect(toggle12m.textContent).toMatch(/12 meses.*operacional/i);
    expect(toggle3y.textContent).toMatch(/3 anos.*IATF 9\.2\.2\.2.*cobertura trienal/i);
  });

  async function activateHeatmap(container: HTMLElement) {
    const user = userEvent.setup();
    const showAllBtn = within(container).getByText(/mostrar todos/i);
    await user.click(showAllBtn);
  }

  it("renderiza células do heatmap com paleta Cividis", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.heatmap);
    await activateHeatmap(container);
    const cells = within(container).getAllByTestId(/^heatmap-cell-/);
    expect(cells.length).toBeGreaterThan(0);

    for (const cell of cells) {
      expect(cell.getAttribute("data-palette")).toBe("cividis");
    }
  });

  it("células vazias mostram hachura/cinza-vermelho + 'gap'", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.heatmap);
    await activateHeatmap(container);
    const emptyCells = within(container).getAllByTestId(/^heatmap-cell-empty-/);
    expect(emptyCells.length).toBeGreaterThan(0);

    for (const cell of emptyCells) {
      expect(cell.getAttribute("data-empty")).toBe("true");
      expect(within(cell).getByText(/gap/i)).toBeInTheDocument();
    }
  });

  it("tooltip de célula com volume ≥5 mostra % aderência", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.heatmap);
    await activateHeatmap(container);
    const user = userEvent.setup();
    const cells = within(container).getAllByTestId(/^heatmap-cell-/);
    const largeCell = cells.find((c) => Number(c.getAttribute("data-volume") ?? 0) >= 5);

    if (largeCell) {
      await user.hover(largeCell);
      const tooltip = await screen.findByTestId("chart-tooltip");
      expect(tooltip.textContent).toMatch(/%\s*aderência/i);
    }
  });

  it("tooltip de célula com volume <5 mostra aviso de amostra pequena", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.heatmap);
    await activateHeatmap(container);
    const user = userEvent.setup();
    const cells = within(container).getAllByTestId(/^heatmap-cell-/);
    const smallCell = cells.find(
      (c) => {
        const vol = Number(c.getAttribute("data-volume") ?? 0);
        return vol > 0 && vol < 5;
      },
    );

    if (smallCell) {
      await user.hover(smallCell);
      const tooltip = await screen.findByTestId("chart-tooltip");
      expect(tooltip.textContent).toMatch(/amostra muito pequena/i);
    }
  });

  it("exibe estado vazio correto quando sem dados", async () => {
    const container = await renderChartContainerEmpty(CHART_TESTIDS.heatmap);
    expect(within(container).getByText(EMPTY_STATE_PT)).toBeInTheDocument();
  });
});

// =========================================================================
// 5. P7 — Funil de Execução do Programa
// =========================================================================

describe("P7 — Funil de Execução do Programa chart rendering", () => {
  it("renderiza o container com data-testid correto", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.funil);
    expect(container).toBeInTheDocument();
  });

  it("exibe o título frozen PT-BR", async () => {
    await renderChartContainer(CHART_TESTIDS.funil);
    expect(screen.getByText(TITLES_PT.funil)).toBeInTheDocument();
  });

  it("renderiza 4 barras horizontais do funil", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.funil);
    const bars = within(container).getAllByTestId(/^funnel-bar-/);
    expect(bars).toHaveLength(4);

    const stages = bars.map((b) => b.getAttribute("data-stage"));
    expect(stages).toContain("planejadas");
    expect(stages).toContain("realizadas-30d");
    expect(stages).toContain("score-gte-70");
  });

  it("mostra anotação lateral de replanejadas", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.funil);
    const annotation = within(container).getByTestId("funnel-annotation-replanned");
    expect(annotation).toBeInTheDocument();
    expect(annotation.textContent).toMatch(/replanejada/i);
  });

  it("nota de rodapé sobre realizadas fora da tolerância", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.funil);
    const footnote = within(container).getByTestId("funnel-footnote");
    expect(footnote).toBeInTheDocument();
    expect(footnote.textContent).toMatch(
      /auditorias realizadas fora da tolerância de 30 dias não contam para esta etapa/i,
    );
  });

  it("etapa 4 labeled 'Score ≥ 70 (VDA B ou superior)'", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.funil);
    const stage4 = within(container).getByTestId("funnel-bar-score-gte-70");
    expect(stage4.textContent).toMatch(/Score ≥ 70.*VDA B/i);
  });

  it("tooltip VDA mostra escala A/AB/B/C", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.funil);
    const user = userEvent.setup();
    const stage4 = within(container).getByTestId("funnel-bar-score-gte-70");

    await user.hover(stage4);
    const tooltip = await screen.findByTestId("chart-tooltip");
    const text = tooltip.textContent ?? "";

    expect(text).toMatch(/A\s*[≥:]\s*90/);
    expect(text).toMatch(/AB\s*[:\s]*80/);
    expect(text).toMatch(/B\s*[:\s]*70/);
    expect(text).toMatch(/C\s*[<:\s]*60/);
  });

  it("exibe estado vazio correto quando sem dados", async () => {
    const container = await renderChartContainerEmpty(CHART_TESTIDS.funil);
    expect(within(container).getByText(EMPTY_STATE_PT)).toBeInTheDocument();
    expect(within(container).getByText(new RegExp(EMPTY_STATE_HINT_PT))).toBeInTheDocument();
  });
});

// =========================================================================
// 6. Estado vazio — regra geral para todos os charts
// =========================================================================

describe("Charts empty state (regra geral CEO #33)", () => {
  it.each([
    CHART_TESTIDS.aderencia,
    CHART_TESTIDS.replanejamento,
    CHART_TESTIDS.heatmap,
    CHART_TESTIDS.funil,
  ])("chart %s nunca renderiza quadro branco — sempre mostra mensagem", async (testId) => {
    const container = await renderChartContainerEmpty(testId);
    expect(container.textContent).toBeTruthy();
    expect(container.textContent!.length).toBeGreaterThan(10);
  });
});

// =========================================================================
// 7. Drill-down — cada chart tem callback de drill-down
// =========================================================================

describe("Charts drill-down callbacks", () => {
  it("P1 dispara drill-down por mês ao clicar numa barra", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.aderencia);
    const user = userEvent.setup();
    const bars = within(container).getAllByTestId(/^bar-segment-/);
    if (bars.length > 0) {
      await user.click(bars[0]);
      expect(screen.getByTestId("drill-down-active")).toBeInTheDocument();
    }
  });

  it("P2 dispara drill-down por departamento ao clicar num ponto", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.replanejamento);
    const user = userEvent.setup();
    const points = within(container).getAllByTestId(/^scatter-point-/);
    if (points.length > 0) {
      await user.click(points[0]);
      expect(screen.getByTestId("drill-down-active")).toBeInTheDocument();
    }
  });

  it("P3 dispara drill-down por setor+tipo ao clicar numa célula", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.heatmap);
    const showAllBtn = within(container).getByText(/mostrar todos/i);
    const user = userEvent.setup();
    await user.click(showAllBtn);
    const cells = within(container).getAllByTestId(/^heatmap-cell-/);
    if (cells.length > 0) {
      await user.click(cells[0]);
      expect(screen.getByTestId("drill-down-active")).toBeInTheDocument();
    }
  });

  it("P7 dispara drill-down por etapa ao clicar numa barra", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.funil);
    const user = userEvent.setup();
    const bars = within(container).getAllByTestId(/^funnel-bar-/);
    if (bars.length > 0) {
      await user.click(bars[0]);
      expect(screen.getByTestId("drill-down-active")).toBeInTheDocument();
    }
  });
});

// =========================================================================
// 8. i18n — chaves PT-BR e EN-US para títulos frozen
// =========================================================================

describe("Charts i18n (PT-BR + EN-US)", () => {
  it("todos os títulos frozen existem em PT-BR no semantic view", () => {
    const view = getReportSemanticView(REPORT_ID, [], "pt-BR");
    const titles = view.charts.map((c) => c.title);

    expect(titles).toContain(TITLES_PT.aderencia);
    expect(titles).toContain(TITLES_PT.replanejamento);
    expect(titles).toContain(TITLES_PT.heatmap);
    expect(titles).toContain(TITLES_PT.funil);
  });

  it("todos os títulos frozen existem em EN-US no semantic view", () => {
    const view = getReportSemanticView(REPORT_ID, [], "en-US");
    const titles = view.charts.map((c) => c.title);

    expect(titles).toContain(TITLES_EN.aderencia);
    expect(titles).toContain(TITLES_EN.replanejamento);
    expect(titles).toContain(TITLES_EN.heatmap);
    expect(titles).toContain(TITLES_EN.funil);
  });
});

// =========================================================================
// 9. P3 — Toggle de período (12m vs 3y IATF)
// =========================================================================

describe("P3 — Heatmap period toggle interaction", () => {
  it("toggle 3 anos recarrega dados com período IATF 9.2.2.2", async () => {
    const container = await renderChartContainer(CHART_TESTIDS.heatmap);
    const user = userEvent.setup();

    const toggle3y = within(container).getByTestId("heatmap-toggle-3y");
    await user.click(toggle3y);

    expect(toggle3y).toHaveAttribute("aria-pressed", "true");
    const toggle12m = within(container).getByTestId("heatmap-toggle-12m");
    expect(toggle12m).toHaveAttribute("aria-pressed", "false");
  });
});

// =========================================================================
// 10. P1 — Mobile degradation (320-480px → 3 segments)
// =========================================================================

describe("P1 — mobile responsive degradation", () => {
  it("em viewport ≤480px degrada de 4 para 3 segmentos (no prazo / fora / vencida)", async () => {
    const container = await renderChartContainerMobile(CHART_TESTIDS.aderencia);
    const mobileAttr = container.getAttribute("data-responsive-mode");
    expect(mobileAttr).toBe("compact");
  });
});

// =========================================================================
// Helper: render a chart container (App-level, mocked fetch)
// =========================================================================

async function renderChartContainer(chartTestId: string): Promise<HTMLElement> {
  installFetchMockWithData();
  renderApp();
  await screen.findByText("Auditorias Planejadas");
  return screen.findByTestId(chartTestId);
}

async function renderChartContainerEmpty(chartTestId: string): Promise<HTMLElement> {
  installFetchMockEmpty();
  renderApp();
  await screen.findByText("Auditorias Planejadas");
  return screen.findByTestId(chartTestId);
}

async function renderChartContainerMobile(chartTestId: string): Promise<HTMLElement> {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });
  window.dispatchEvent(new Event("resize"));

  installFetchMockWithData();
  renderApp();
  await screen.findByText("Auditorias Planejadas");
  return screen.findByTestId(chartTestId);
}

function installFetchMockWithData(): void {
  fetchMock.mockImplementation((input: Request | string | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes(`/${REPORT_ID}/kpis`)) return Promise.resolve(buildKpisResponse());
    if (url.includes(`/${REPORT_ID}/charts`)) {
      return Promise.resolve(
        buildChartsResponse({
          "aderencia-mensal": SAMPLE_ADERENCIA,
          "replanejamento-scatter": SAMPLE_REPLANEJAMENTO,
          "heatmap-setor-tipo": SAMPLE_HEATMAP,
          "funil-execucao": SAMPLE_FUNIL,
        }),
      );
    }
    if (url.endsWith("/api/v1/reports") || url.endsWith("/api/v1/reports/")) {
      return Promise.resolve(buildCatalogResponse());
    }
    if (url.includes(`/api/v1/reports/${REPORT_ID}`)) {
      return Promise.resolve(buildReportRowsResponse([
        { AuditingPlanningCode: 192, CompanyCorporateName: "Magna", AuditingPlanningPlannedDate: "2026-03-18", ResponsibleName: "Ana", Sector_Description: "Qualidade" },
      ]));
    }
    return Promise.resolve(buildCatalogResponse());
  });
}

function installFetchMockEmpty(): void {
  fetchMock.mockImplementation((input: Request | string | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes(`/${REPORT_ID}/kpis`)) return Promise.resolve(buildKpisResponse());
    if (url.includes(`/${REPORT_ID}/charts`)) {
      return Promise.resolve(
        buildChartsResponse({
          "aderencia-mensal": EMPTY_ADERENCIA,
          "replanejamento-scatter": EMPTY_REPLANEJAMENTO,
          "heatmap-setor-tipo": EMPTY_HEATMAP,
          "funil-execucao": EMPTY_FUNIL,
        }),
      );
    }
    if (url.endsWith("/api/v1/reports") || url.endsWith("/api/v1/reports/")) {
      return Promise.resolve(buildCatalogResponse());
    }
    if (url.includes(`/api/v1/reports/${REPORT_ID}`)) {
      return Promise.resolve(buildReportRowsResponse([]));
    }
    return Promise.resolve(buildCatalogResponse());
  });
}

function renderApp(): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}
