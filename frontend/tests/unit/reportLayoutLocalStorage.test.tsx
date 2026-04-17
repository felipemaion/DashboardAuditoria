/**
 * TDD — testes de regressão para a interação entre `localStorage`
 * (`dashboard-magna-layout`) e os 11 novos `defaultHiddenColumnsByReport`
 * para `auditorias-planejadas`.
 *
 * Risco mapeado pelo CEO na Fase A: usuários com layout salvo ANTES da
 * correção do default não devem (a) quebrar a UI, (b) seguir vendo campos
 * técnicos como GUID/Tuple* sem perceber.
 *
 * Comportamento atual mapeado por inspeção em
 * `frontend/src/components/ReportExplorer.tsx:327-331`:
 *
 *   const hiddenColumns =
 *     layoutPreferences.hiddenColumnsByReport[reportId] ??
 *     getDefaultHiddenColumns(reportId);
 *
 * O operador `??` significa: se houver QUALQUER entrada salva (mesmo `[]`),
 * a preferência VENCE o default novo. Isso é o caso (a) do briefing —
 * preferência do usuário sobrepõe os defaults. Para usuários legados que
 * abriram o relatório antes da Fase A e não tinham hidden algum, os 11
 * campos técnicos seguirão visíveis até reset manual de layout.
 *
 * Os testes abaixo:
 *  1. Garantem default aplicado quando não há entrada salva (Fase A funciona).
 *  2. DOCUMENTAM o comportamento atual (a) — preferência vazia mantém
 *     campo técnico visível. Caso vire bug, há nova task aberta.
 *  3. Garantem fallback gracioso quando o JSON salvo está corrompido.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { App } from "../../src/App";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
  fetchMock.mockReset();
  localStorage.clear();
});

const ROW_WITH_TECHNICAL_FIELDS = {
  AuditingPlanningCode: 101,
  CompanyCorporateName: "Magna",
  AuditingPlanningPlannedDate: "2026-04-10",
  AuditingPlanningGuid: "00000000-aaaa-bbbb-cccc-000000000001",
  AuditingPlanningTupleExcluded: 0,
  AuditingPlanningUserModification: "legacy.user",
  ContextCode: "ctx-1",
};

function mockReportRequests(): void {
  fetchMock
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          reports: [
            {
              report_id: "auditorias-planejadas",
              title: "Auditorias Planejadas",
              sql_file_name: "auditorias_planejadas.sql",
              status: "available",
              blocked_reason: null,
            },
          ],
        }),
        { status: 200 },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          report_id: "auditorias-planejadas",
          title: "Auditorias Planejadas",
          limit: 120,
          offset: 0,
          row_count: 1,
          rows: [ROW_WITH_TECHNICAL_FIELDS],
        }),
        { status: 200 },
      ),
    );
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

describe("ReportExplorer layout x localStorage (defaultHidden Fase A)", () => {
  it("hides the 11 default technical columns when no localStorage entry exists for the report", async () => {
    mockReportRequests();
    renderApp();

    await screen.findByText("Auditorias Planejadas");
    await screen.findAllByRole("columnheader");

    expect(
      screen.queryByRole("columnheader", { name: "AuditingPlanningGuid" }),
      "AuditingPlanningGuid deveria estar oculto pelo defaultHidden Fase A",
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "AuditingPlanningTupleExcluded" }),
      "AuditingPlanningTupleExcluded deveria estar oculto pelo defaultHidden Fase A",
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "AuditingPlanningUserModification" }),
      "AuditingPlanningUserModification deveria estar oculto pelo defaultHidden Fase A",
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "ContextCode" }),
      "ContextCode deveria estar oculto pelo defaultHidden Fase A",
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "CompanyCorporateName" }),
      "CompanyCorporateName deveria seguir visível como campo de negócio",
    ).toBeInTheDocument();
  });

  it("merges defaultHidden with legacy empty preference — defaults técnicos vencem para proteger usuários pré-Fase A", async () => {
    localStorage.setItem(
      "dashboard-magna-layout",
      JSON.stringify({
        sidebarCollapsed: false,
        tableDensity: "comfortable",
        tableHeaderSize: "medium",
        hiddenColumnsByReport: {
          "auditorias-planejadas": [],
        },
        columnOrderByReport: {},
        columnWidthsByReport: {},
        pinnedColumnsByReport: {},
        sortByReport: {},
        quickFiltersByReport: {},
      }),
    );

    mockReportRequests();
    renderApp();

    await screen.findByText("Auditorias Planejadas");
    await screen.findAllByRole("columnheader");

    expect(
      screen.queryByRole("columnheader", { name: "AuditingPlanningGuid" }),
      "Nova semântica (união): defaults técnicos sobrepõem preferência vazia legada",
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "AuditingPlanningUserModification" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "CompanyCorporateName" }),
    ).toBeInTheDocument();
  });

  it("falls back to defaultHidden gracefully when localStorage payload is corrupted JSON", async () => {
    localStorage.setItem("dashboard-magna-layout", "{ this is not valid json");

    mockReportRequests();
    renderApp();

    await screen.findByText("Auditorias Planejadas");
    await screen.findAllByRole("columnheader");

    expect(
      screen.queryByRole("columnheader", { name: "AuditingPlanningGuid" }),
      "Layout corrompido deve cair no defaultHidden — AuditingPlanningGuid oculto",
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "AuditingPlanningUserModification" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "CompanyCorporateName" }),
    ).toBeInTheDocument();
  });

  it("respects user preference that explicitly hides extra business columns alongside defaults", async () => {
    localStorage.setItem(
      "dashboard-magna-layout",
      JSON.stringify({
        sidebarCollapsed: false,
        tableDensity: "comfortable",
        tableHeaderSize: "medium",
        hiddenColumnsByReport: {
          "auditorias-planejadas": ["CompanyCorporateName"],
        },
        columnOrderByReport: {},
        columnWidthsByReport: {},
        pinnedColumnsByReport: {},
        sortByReport: {},
        quickFiltersByReport: {},
      }),
    );

    mockReportRequests();
    renderApp();

    await screen.findByText("Auditorias Planejadas");
    await screen.findAllByRole("columnheader");

    expect(
      screen.queryByRole("columnheader", { name: "CompanyCorporateName" }),
      "Preferência explícita do usuário deve esconder CompanyCorporateName",
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "AuditingPlanningCode" }),
      "Outras colunas seguem visíveis quando não estão na lista hidden do usuário",
    ).toBeInTheDocument();
  });
});
