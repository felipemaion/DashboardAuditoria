/**
 * TDD — testes de renderização e contrato semântico para os 4 KPIs executivos
 * de `auditorias-planejadas`. Fórmulas CONGELADAS pelo CEO (Task #18).
 *
 * Cobertura exigida (do briefing do team-lead na Task #19):
 *   1. Os 4 KPIs genéricos do `buildGenericKpis` (total-records, owners,
 *      top-focus, dated-records) NÃO devem aparecer para auditorias-planejadas.
 *   2. Os 4 KPIs executivos devem aparecer com IDs estáveis.
 *   3. Tooltips obrigatórios contêm o texto EXATO aprovado pelo CEO em #18.
 *   4. KPI 3 mostra % primário e contagem absoluta secundária no mesmo card.
 *   5. KPI 4 expõe flag IATF 16949 §7.2.3 quando há ResponsibleCode NULL.
 *   6. Severity classes (verde/amarelo/vermelho/neutral) são aplicadas
 *      conforme o severity vindo do backend.
 *   7. KPIs 1 e 2 são os primeiros do grid (lado a lado no topo, decisão CEO).
 *
 * Tooltips frozen pelo CEO (texto EXATO):
 *   KPI 1 — "Considerada aderente quando realizada em até 30 dias após a data planejada (ou replanejada)."
 *   KPI 3 — "Conta auditorias não realizadas após a data prevista (ou replanejada)."
 *
 * Os testes falham legitimamente até que B.6 (frontend) implemente:
 *   - extraKpis que substituam os genéricos para auditorias-planejadas
 *   - fetch da nova rota /api/v1/reports/auditorias-planejadas/kpis
 *   - renderização das cards com `data-kpi-id`, `data-kpi-severity`,
 *     `data-kpi-secondary-count`, `data-kpi-iatf-unassigned`
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";

import { App } from "../../src/App";
import { getReportSemanticView } from "../../src/lib/reportSemantics";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
  fetchMock.mockReset();
  localStorage.clear();
});

const REPORT_ID = "auditorias-planejadas";

const TOOLTIP_ADERENCIA_PT =
  "Considerada aderente quando realizada em até 30 dias após a data planejada (ou replanejada).";
const TOOLTIP_VENCIDAS_PT =
  "Conta auditorias não realizadas após a data prevista (ou replanejada).";

const FROZEN_KPI_IDS = [
  "aderencia-plano",
  "replanejamento",
  "auditorias-vencidas",
  "proximas-30-dias",
] as const;

const GENERIC_KPI_IDS_TO_REMOVE = [
  "total-records",
  "open-items",
  "owners",
  "top-focus",
  "dated-records",
] as const;

// ---------------------------------------------------------------------------
// Fetch fixtures: catálogo, rows, e a nova rota /kpis (B.5).
// ---------------------------------------------------------------------------

type KpiPayload = {
  id: string;
  value_percent?: number | null;
  value_count?: number;
  numerator?: number;
  denominator?: number;
  severity: "green" | "yellow" | "red" | "neutral";
  unassigned_owner_count?: number;
  iatf_unassigned_flag?: boolean;
};

function buildKpisResponse(kpis: KpiPayload[]): Response {
  return new Response(
    JSON.stringify({
      report_id: REPORT_ID,
      reference_date: "2026-04-16",
      period_start: "2026-01-01",
      period_end: "2026-04-16",
      kpis,
    }),
    { status: 200 },
  );
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

function buildReportRowsResponse(): Response {
  return new Response(
    JSON.stringify({
      report_id: REPORT_ID,
      title: "Auditorias Planejadas",
      limit: 120,
      offset: 0,
      row_count: 1,
      rows: [
        {
          AuditingPlanningCode: 101,
          CompanyCorporateName: "Magna",
          AuditingPlanningPlannedDate: "2026-04-10",
          ResponsibleName: "Ana",
          Sector_Description: "Qualidade",
        },
      ],
    }),
    { status: 200 },
  );
}

function installFetchMock(kpis: KpiPayload[]): void {
  fetchMock.mockImplementation((input: Request | string | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.endsWith(`/api/v1/reports/${REPORT_ID}/kpis`) || url.includes(`/${REPORT_ID}/kpis`)) {
      return Promise.resolve(buildKpisResponse(kpis));
    }
    if (url.endsWith("/api/v1/reports") || url.endsWith("/api/v1/reports/")) {
      return Promise.resolve(buildCatalogResponse());
    }
    if (url.includes(`/api/v1/reports/${REPORT_ID}`)) {
      return Promise.resolve(buildReportRowsResponse());
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

// ---------------------------------------------------------------------------
// 1. Camada semântica: 4 IDs frozen, 4 genéricos ausentes, tooltips.
// ---------------------------------------------------------------------------

describe("auditorias-planejadas semantic layer (Fase B.6 contract)", () => {
  it("expõe exatamente os 4 KPIs executivos no createDefinition (sem os genéricos)", () => {
    /**
     * KPI 1 (% Aderência), KPI 2 (% Replanejamento), KPI 3 (Vencidas) e
     * KPI 4 (Próximas 30d) substituem os genéricos para auditorias-planejadas.
     */
    const view = getReportSemanticView(REPORT_ID, [], "pt-BR");
    const kpiIds = view.kpis.map((kpi) => kpi.id);

    for (const id of FROZEN_KPI_IDS) {
      expect(
        kpiIds,
        `KPI executivo "${id}" deve estar presente em ${REPORT_ID}`,
      ).toContain(id);
    }
    for (const genericId of GENERIC_KPI_IDS_TO_REMOVE) {
      expect(
        kpiIds,
        `KPI genérico "${genericId}" não deve aparecer em ${REPORT_ID} (substituído pelos executivos)`,
      ).not.toContain(genericId);
    }
  });

  it("tooltip do KPI 1 contém o texto exato aprovado pelo CEO #18", () => {
    /**
     * Texto frozen: "Considerada aderente quando realizada em até 30 dias após
     * a data planejada (ou replanejada)."
     */
    const view = getReportSemanticView(REPORT_ID, [], "pt-BR");
    const kpiAderencia = view.kpis.find((kpi) => kpi.id === "aderencia-plano");

    expect(kpiAderencia, "KPI aderencia-plano não encontrado").toBeDefined();
    expect(kpiAderencia?.tooltip).toContain(TOOLTIP_ADERENCIA_PT);
  });

  it("tooltip do KPI 3 contém o texto exato aprovado pelo CEO #18", () => {
    /**
     * Texto frozen: "Conta auditorias não realizadas após a data prevista (ou replanejada)."
     */
    const view = getReportSemanticView(REPORT_ID, [], "pt-BR");
    const kpiVencidas = view.kpis.find((kpi) => kpi.id === "auditorias-vencidas");

    expect(kpiVencidas, "KPI auditorias-vencidas não encontrado").toBeDefined();
    expect(kpiVencidas?.tooltip).toContain(TOOLTIP_VENCIDAS_PT);
  });

  it("KPIs 1 e 2 ocupam as DUAS PRIMEIRAS posições da lista (lado a lado no topo)", () => {
    /**
     * Decisão de layout do CEO #18: aderência e replanejamento são os
     * indicadores estratégicos — devem dominar o topo do dashboard.
     */
    const view = getReportSemanticView(REPORT_ID, [], "pt-BR");

    expect(view.kpis[0]?.id).toBe("aderencia-plano");
    expect(view.kpis[1]?.id).toBe("replanejamento");
  });
});

// ---------------------------------------------------------------------------
// 2. Camada de renderização: cards + severity + secondary count + IATF flag.
// ---------------------------------------------------------------------------

describe("auditorias-planejadas KPI cards rendering (Fase B.6 contract)", () => {
  it("renderiza as 4 cards executivas e oculta as cards genéricas", async () => {
    /**
     * Quando o relatório auditorias-planejadas é selecionado, a UI exibe
     * APENAS as 4 cards aprovadas pelo CEO #18 — nenhuma das 4 genéricas.
     */
    installFetchMock([
      { id: "aderencia-plano", value_percent: 92, numerator: 46, denominator: 50, severity: "yellow" },
      { id: "replanejamento", value_percent: 8, numerator: 4, denominator: 50, severity: "green" },
      { id: "auditorias-vencidas", value_percent: 3, value_count: 3, denominator: 100, severity: "yellow" },
      { id: "proximas-30-dias", value_count: 18, unassigned_owner_count: 0, iatf_unassigned_flag: false, severity: "neutral" },
    ]);

    renderApp();
    await screen.findByText("Auditorias Planejadas");

    const grid = await screen.findByTestId("kpi-grid");
    const cards = within(grid).getAllByTestId(/^kpi-card-/);
    const renderedKpiIds = cards.map((card) => card.getAttribute("data-kpi-id"));

    for (const id of FROZEN_KPI_IDS) {
      expect(
        renderedKpiIds,
        `Card executiva "${id}" precisa estar renderizada`,
      ).toContain(id);
    }
    for (const genericId of GENERIC_KPI_IDS_TO_REMOVE) {
      expect(
        renderedKpiIds,
        `Card genérica "${genericId}" não pode aparecer junto das executivas`,
      ).not.toContain(genericId);
    }
  });

  it("aplica severity class por KPI (verde/amarelo/vermelho/neutral)", async () => {
    /**
     * Threshold encoding (CEO #18):
     *   KPI 1: >=95 verde, 85-94 amarelo, <85 vermelho
     *   KPI 2: <=10 verde, 10-30 amarelo, >30 vermelho
     *   KPI 3: <=2 verde, 2-5 amarelo, >5 vermelho
     *   KPI 4: sem cor → neutral
     */
    installFetchMock([
      { id: "aderencia-plano", value_percent: 96, numerator: 48, denominator: 50, severity: "green" },
      { id: "replanejamento", value_percent: 35, numerator: 17, denominator: 50, severity: "red" },
      { id: "auditorias-vencidas", value_percent: 4, value_count: 4, denominator: 100, severity: "yellow" },
      { id: "proximas-30-dias", value_count: 12, unassigned_owner_count: 0, iatf_unassigned_flag: false, severity: "neutral" },
    ]);

    renderApp();
    await screen.findByText("Auditorias Planejadas");

    const grid = await screen.findByTestId("kpi-grid");

    expect(within(grid).getByTestId("kpi-card-aderencia-plano").getAttribute("data-kpi-severity")).toBe("green");
    expect(within(grid).getByTestId("kpi-card-replanejamento").getAttribute("data-kpi-severity")).toBe("red");
    expect(within(grid).getByTestId("kpi-card-auditorias-vencidas").getAttribute("data-kpi-severity")).toBe("yellow");
    expect(within(grid).getByTestId("kpi-card-proximas-30-dias").getAttribute("data-kpi-severity")).toBe("neutral");
  });

  it("KPI 3 expõe % primário e contagem absoluta secundária na mesma card", async () => {
    /**
     * Decisão CEO #18: o usuário precisa ver o percentual (gestão) E o número
     * absoluto (operação) lado a lado na mesma card de Vencidas.
     */
    installFetchMock([
      { id: "aderencia-plano", value_percent: null, numerator: 0, denominator: 0, severity: "neutral" },
      { id: "replanejamento", value_percent: null, numerator: 0, denominator: 0, severity: "neutral" },
      { id: "auditorias-vencidas", value_percent: 3.5, value_count: 7, denominator: 200, severity: "yellow" },
      { id: "proximas-30-dias", value_count: 0, unassigned_owner_count: 0, iatf_unassigned_flag: false, severity: "neutral" },
    ]);

    renderApp();
    await screen.findByText("Auditorias Planejadas");

    const card = await screen.findByTestId("kpi-card-auditorias-vencidas");
    expect(card.getAttribute("data-kpi-secondary-count")).toBe("7");
    expect(within(card).getByText(/3[,.]5\s*%/)).toBeInTheDocument();
    expect(within(card).getByText(/\b7\b/)).toBeInTheDocument();
  });

  it("KPI 4 marca flag IATF 16949 §7.2.3 quando há responsável NÃO atribuído", async () => {
    /**
     * Decisão CEO #18: ResponsibleCode IS NULL aciona alerta neutro IATF
     * (não é vermelho — é uma chamada de atenção operacional).
     */
    installFetchMock([
      { id: "aderencia-plano", value_percent: null, numerator: 0, denominator: 0, severity: "neutral" },
      { id: "replanejamento", value_percent: null, numerator: 0, denominator: 0, severity: "neutral" },
      { id: "auditorias-vencidas", value_percent: 0, value_count: 0, denominator: 0, severity: "neutral" },
      { id: "proximas-30-dias", value_count: 12, unassigned_owner_count: 3, iatf_unassigned_flag: true, severity: "neutral" },
    ]);

    renderApp();
    await screen.findByText("Auditorias Planejadas");

    const card = await screen.findByTestId("kpi-card-proximas-30-dias");
    expect(card.getAttribute("data-kpi-iatf-unassigned")).toBe("true");
    expect(card.getAttribute("data-kpi-severity")).toBe("neutral");
  });

  it("KPIs 1 e 2 são as DUAS primeiras cards do grid (lado a lado no topo)", async () => {
    /**
     * Layout frozen pelo CEO #18: aderência e replanejamento dominam o topo.
     */
    installFetchMock([
      { id: "aderencia-plano", value_percent: 88, numerator: 44, denominator: 50, severity: "yellow" },
      { id: "replanejamento", value_percent: 12, numerator: 6, denominator: 50, severity: "yellow" },
      { id: "auditorias-vencidas", value_percent: 1, value_count: 1, denominator: 100, severity: "green" },
      { id: "proximas-30-dias", value_count: 8, unassigned_owner_count: 0, iatf_unassigned_flag: false, severity: "neutral" },
    ]);

    renderApp();
    await screen.findByText("Auditorias Planejadas");

    const grid = await screen.findByTestId("kpi-grid");
    const cards = within(grid).getAllByTestId(/^kpi-card-/);

    expect(cards[0]?.getAttribute("data-kpi-id")).toBe("aderencia-plano");
    expect(cards[1]?.getAttribute("data-kpi-id")).toBe("replanejamento");
  });

  it("tooltip renderizado da card aderência expõe o texto exato do CEO #18", async () => {
    /**
     * Tooltip renderizado deve permitir auditoria do significado pelo
     * usuário/diretor sem ambiguidade ("até 30 dias", "ou replanejada").
     */
    installFetchMock([
      { id: "aderencia-plano", value_percent: 92, numerator: 46, denominator: 50, severity: "yellow" },
      { id: "replanejamento", value_percent: 5, numerator: 2, denominator: 40, severity: "green" },
      { id: "auditorias-vencidas", value_percent: 1, value_count: 1, denominator: 100, severity: "green" },
      { id: "proximas-30-dias", value_count: 9, unassigned_owner_count: 0, iatf_unassigned_flag: false, severity: "neutral" },
    ]);

    renderApp();
    const user = userEvent.setup();
    await screen.findByText("Auditorias Planejadas");

    const card = await screen.findByTestId("kpi-card-aderencia-plano");
    const tooltipTrigger = within(card).getByRole("button", { name: /aderência/i });
    await user.hover(tooltipTrigger);

    expect(await screen.findByText(new RegExp(TOOLTIP_ADERENCIA_PT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeInTheDocument();
  });
});
