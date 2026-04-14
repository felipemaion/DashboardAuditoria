import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";

import { App } from "../../src/App";

const fetchMock = vi.fn();
const localStorageSetItemSpy = vi.spyOn(Storage.prototype, "setItem");

vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
  fetchMock.mockReset();
  localStorage.clear();
  localStorageSetItemSpy.mockClear();
});

describe("App", () => {
  it("renders PT-BR by default and allows switching to EN-US", async () => {
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
              {
                report_id: "ocorrencias-ff",
                title: "Ocorrencias FF",
                sql_file_name: "ocorrencias_ff.sql",
                status: "available",
                blocked_reason: null,
              },
              {
                report_id: "atividades-completas",
                title: "Atividades Completas",
                sql_file_name: "atividades_completas.sql",
                status: "blocked_by_permissions",
                blocked_reason: "SELECT denied",
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
            row_count: 2,
            rows: [
              {
                AuditingPlanningCode: 2,
                CompanyCorporateName: "Magna",
                AuditingPlanningPlannedDate: "2026-04-10",
                AuditingPlanningFrequency: 5,
              },
              {
                AuditingPlanningCode: 4,
                CompanyCorporateName: "Cosma",
                AuditingPlanningPlannedDate: "2026-04-11",
                AuditingPlanningFrequency: 7,
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            report_id: "ocorrencias-ff",
            title: "Ocorrencias FF",
            limit: 120,
            offset: 0,
            row_count: 1,
            rows: [
              {
                "Issue #": 1107,
                "Type Occurrence": "FF",
                Champion: "Mauricio",
                "Issue Date": "2026-03-20",
              },
            ],
          }),
          { status: 200 },
        ),
      );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { name: /dashboards executivos/i })).toBeInTheDocument();

    await screen.findByText("Auditorias Planejadas");

    expect(screen.getByRole("heading", { name: /relatórios disponíveis/i })).toBeInTheDocument();
    expect(screen.getByText("Atividades Completas")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /bloqueados por permissão/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /atividades completas/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /english \(united states\)/i }));

    expect(
      screen.getByRole("heading", { name: /executive dashboards for magna operations/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /available reports/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /interactive charts/i })).toBeInTheDocument();
  });

  it("allows collapsing and reopening the report sidebar", async () => {
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
            rows: [
              {
                AuditingPlanningCode: 2,
                CompanyCorporateName: "Magna",
                AuditingPlanningPlannedDate: "2026-04-10",
                AuditingPlanningFrequency: 5,
              },
            ],
          }),
          { status: 200 },
        ),
      );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    await screen.findByText("Auditorias Planejadas");

    const collapseButton = screen.getByRole("button", { name: /recolher navegação/i });
    await userEvent.click(collapseButton);

    const expandButton = screen.getByRole("button", { name: /expandir navegação/i });
    expect(expandButton).toBeInTheDocument();
    expect(within(expandButton.closest("aside") ?? document.body).getByRole("button", { name: /^auditorias planejadas$/i })).toBeInTheDocument();

    await userEvent.click(expandButton);

    expect(screen.getByRole("button", { name: /recolher navegação/i })).toBeInTheDocument();
  });

  it("restores persisted layout preferences and updates them", async () => {
    localStorage.setItem(
      "dashboard-magna-layout",
      JSON.stringify({
        sidebarCollapsed: true,
        tableDensity: "compact",
        tableHeaderSize: "large",
        hiddenColumnsByReport: {
          "auditorias-planejadas": ["AuditingPlanningFrequency"],
        },
        columnOrderByReport: {
          "auditorias-planejadas": [
            "CompanyCorporateName",
            "AuditingPlanningCode",
            "AuditingPlanningPlannedDate",
            "AuditingPlanningFrequency",
          ],
        },
        columnWidthsByReport: {
          "auditorias-planejadas": {
            CompanyCorporateName: 280,
          },
        },
        pinnedColumnsByReport: {
          "auditorias-planejadas": ["CompanyCorporateName"],
        },
        sortByReport: {
          "auditorias-planejadas": {
            field: "CompanyCorporateName",
            direction: "asc",
          },
        },
        quickFiltersByReport: {
          "auditorias-planejadas": {
            CompanyCorporateName: "Magna",
          },
        },
      }),
    );

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
            rows: [
              {
                AuditingPlanningCode: 2,
                CompanyCorporateName: "Magna",
                AuditingPlanningPlannedDate: "2026-04-10",
                AuditingPlanningFrequency: 5,
              },
            ],
          }),
          { status: 200 },
        ),
      );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    await screen.findByText("Auditorias Planejadas");

    expect(screen.getByRole("button", { name: /expandir navegação/i })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /detalhamento dos registros/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resumo do contexto do relatório/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /seções do relatório/i })).toBeInTheDocument();
    const columnHeaders = await screen.findAllByRole("columnheader");
    expect(screen.queryByRole("columnheader", { name: /frequência/i })).not.toBeInTheDocument();
    expect(columnHeaders[0]).toHaveTextContent(/empresa/i);
    expect(columnHeaders[0]).toHaveStyle({ width: "280px" });
    expect(screen.getByDisplayValue("Magna")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /desafixar coluna empresa/i })).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /mostrar coluna auditingplanningfrequency/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /desafixar coluna empresa/i }));
    await userEvent.click(screen.getByRole("button", { name: /resetar layout da tabela/i }));

    expect(screen.getByRole("columnheader", { name: /auditingplanningfrequency/i })).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Magna")).not.toBeInTheDocument();

    expect(localStorageSetItemSpy).toHaveBeenCalled();
  });
});
