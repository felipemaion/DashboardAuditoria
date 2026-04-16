import {
  applyReportFilters,
  applyReportFiltersWithDateRange,
  buildCrossReportInsights,
  buildCsv,
  buildFilterDefinitions,
  paginateRows,
  type ReportRecord,
} from "../../src/lib/reportExplorer.testable";

describe("reportExplorer state helpers", () => {
  const rows: ReportRecord[] = [
    {
      "Focus Factory": "FF-1",
      Status_Occurrence: "Open",
      Champion: "Ana",
      "Issue Date": "2026-04-10",
    },
    {
      "Focus Factory": "FF-2",
      Status_Occurrence: "Closed",
      Champion: "Bruno",
      "Issue Date": "2026-04-11",
    },
    {
      "Focus Factory": "FF-1",
      Status_Occurrence: "Open",
      Champion: "Carla",
      "Issue Date": "2026-04-12",
    },
  ];

  it("builds semantic filter definitions with curated options", () => {
    const filters = buildFilterDefinitions("ocorrencias-com-indicador", rows, "pt-BR");

    expect(filters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "Focus Factory",
          label: "Focus Factory",
          options: ["FF-1", "FF-2"],
        }),
        expect.objectContaining({
          field: "Status_Occurrence",
          label: "Status executivo",
          options: ["Closed", "Open"],
        }),
      ]),
    );
  });

  it("builds filter labels according to the selected locale", () => {
    const ptFilters = buildFilterDefinitions("ocorrencias-com-indicador", rows, "pt-BR");
    const enFilters = buildFilterDefinitions("ocorrencias-com-indicador", rows, "en-US");

    expect(ptFilters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "Status_Occurrence",
          label: "Status executivo",
        }),
      ]),
    );

    expect(enFilters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "Status_Occurrence",
          label: "Executive status",
        }),
      ]),
    );
  });

  it("translates humanized fallback labels to PT-BR when field metadata is missing", () => {
    const fallbackFilters = buildFilterDefinitions(
      "atividades-de-auditoria",
      [
        {
          CustomRequesterName: "Ana",
          ActivityResponsiblePersonName: "Bruno",
        },
        {
          CustomRequesterName: "Carla",
          ActivityResponsiblePersonName: "Bruno",
        },
      ],
      "pt-BR",
    );

    expect(fallbackFilters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "CustomRequesterName",
          label: "Custom solicitante nome",
          description: "Campo custom solicitante nome disponível neste relatório.",
          source: "CustomRequesterName",
        }),
      ]),
    );
  });

  it("translates common english technical fragments in fallback labels to PT-BR", () => {
    const fallbackFilters = buildFilterDefinitions(
      "atividades-de-auditoria",
      [
        {
          AuditLevelDescription: "L1",
          DocumentNumber: "123",
          FailureOrigin: "Linha A",
        },
        {
          AuditLevelDescription: "L2",
          DocumentNumber: "456",
          FailureOrigin: "Linha B",
        },
      ],
      "pt-BR",
    );

    expect(fallbackFilters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "AuditLevelDescription",
          label: "Nível da auditoria",
        }),
        expect.objectContaining({
          field: "DocumentNumber",
          label: "Document number",
        }),
        expect.objectContaining({
          field: "FailureOrigin",
          label: "Failure origin",
        }),
      ]),
    );
  });

  it("does not break malformed audit aliases into awkward PT-BR labels", () => {
    const filters = buildFilterDefinitions(
      "nao-conformidade",
      [
        {
          auditAuditorPerSOnName: "Ana",
          auditLevelDescriPTion: "L1",
          auditSECtorDescription: "Qualidade",
        },
        {
          auditAuditorPerSOnName: "Bruno",
          auditLevelDescriPTion: "L2",
          auditSECtorDescription: "Processos",
        },
      ],
      "pt-BR",
    );

    expect(filters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "auditAuditorPerSOnName",
          label: "Auditor",
        }),
        expect.objectContaining({
          field: "auditLevelDescriPTion",
          label: "Nível da auditoria",
        }),
        expect.objectContaining({
          field: "auditSECtorDescription",
          label: "Setor da auditoria",
        }),
      ]),
    );
  });

  it("normalizes malformed occurrence aliases before building fallback labels", () => {
    const filters = buildFilterDefinitions(
      "ocorrencias-ff",
      [
        {
          mAX_ImplementedDate_ICA: "2026-04-01",
          mAX_ImplementedDate_PCA: "2026-04-02",
        },
        {
          mAX_ImplementedDate_ICA: "2026-04-03",
          mAX_ImplementedDate_PCA: "2026-04-04",
        },
      ],
      "pt-BR",
    );

    expect(filters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "mAX_ImplementedDate_ICA",
          label: "Max implementada data ica",
        }),
        expect.objectContaining({
          field: "mAX_ImplementedDate_PCA",
          label: "Max implementada data pca",
        }),
      ]),
    );
  });

  it("applies filters and paginates the filtered records", () => {
    const filteredRows = applyReportFilters(rows, {
      "Focus Factory": "FF-1",
      Status_Occurrence: "Open",
    });

    expect(filteredRows).toHaveLength(2);
    expect(paginateRows(filteredRows, 1, 1)).toEqual([rows[0]]);
    expect(paginateRows(filteredRows, 2, 1)).toEqual([rows[2]]);
  });

  it("filters occurrence records between two dates using the report date field", () => {
    const filteredRows = applyReportFiltersWithDateRange(
      rows,
      {},
      {
        field: "Issue Date",
        from: "2026-04-11",
        to: "2026-04-12",
      },
    );

    expect(filteredRows).toEqual([rows[1], rows[2]]);
  });

  it("builds CSV output with escaped values", () => {
    const csv = buildCsv([
      {
        Name: 'Ana "QA"',
        Status: "Open",
      },
    ]);

    expect(csv).toContain("Name,Status");
    expect(csv).toContain('"Ana ""QA"""');
  });

  it("finds cross-report insights using shared business concepts", () => {
    const insights = buildCrossReportInsights(
      "ocorrencias-com-indicador",
      rows,
      [
        {
          reportId: "ocorrencias-ff",
          title: "Ocorrências FF",
          rows: [
            {
              "Focus Factory": "FF-1",
              Champion: "Ana",
              Status_Occurrence: "Open",
            },
          ],
        },
      ],
      "pt-BR",
    );

    expect(insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          relatedReportId: "ocorrencias-ff",
          conceptKey: "focusFactory",
        }),
        expect.objectContaining({
          relatedReportId: "ocorrencias-ff",
          conceptKey: "owner",
        }),
      ]),
    );
  });
});
