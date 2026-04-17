import {
  getFieldMeta,
  getReportConceptEntries,
  getReportSemanticView,
} from "../../src/lib/reportSemantics";

describe("reportSemantics", () => {
  const sampleRowsByReport = {
    "auditorias-planejadas": [
      {
        CompanyCorporateName: "Magna",
        AuditingPlanningTypeAuditCodeDescription: "Processo",
        ResponsibleName: "Ana",
        Sector_Description: "Qualidade",
        AuditingPlanningPlannedDate: "2026-04-14",
        AuditingPlanningDepartmentCodeDescription: "Qualidade",
      },
    ],
    "auditorias-realizadas": [
      {
        CompanyCorporateName: "Magna",
        AuditorName: "Carlos",
        AuditDepartmentCodeDescription: "Produção",
        AuditStartDate: "2026-04-14",
        AuditStatus: "Concluída",
      },
    ],
    "atividades-de-auditoria": [
      {
        ActivityResponsiblePersonName: "Ana",
        auditDepartmentDescription: "Qualidade",
        auditSectorDescription: "Processos",
        auditTypeAuditDescription: "VDA 6.3",
        auditLevelDescription: "Nível A",
        ActivityStagesDescription: "Concluída",
        activityTupleCreatedIn: "2026-04-14 09:00:00",
        activityImplementedDate: "2026-04-18",
        auditEndDate: "2026-04-13",
        auditScore: 92,
      },
    ],
    "nao-conformidade": [
      {
        ActivityResponsiblePersonName: "Bruno",
        auditDepartmentDescription: "Qualidade",
        ActivityStagesDescription: "Em análise",
        activityTupleCreatedIn: "2026-04-14 11:00:00",
      },
    ],
    "ocorrencias-com-e-sem-atividade": [
      {
        "Focus Factory": "FF-1",
        Champion: "Ana",
        Status_Occurrence: "Aberta",
        "Issue Date": "2026-04-14",
        Activity_open: "Sim",
      },
    ],
    "ocorrencias-com-indicador": [
      {
        "Focus Factory": "FF-2",
        Champion: "Bruno",
        Status_Occurrence: "Crítica",
        Indicator: "Indicador A",
        "Issue Date": "2026-04-14",
      },
    ],
    "ocorrencias-ff": [
      {
        "Machine / Station resp.": "Prensa 01",
        "Focus Factory": "FF-3",
        Champion: "Carla",
        Status_Occurrence: "Aberta",
        Indicator: "Indicador B",
        "Issue Date": "2026-04-14",
        Activity_open: "2",
      },
    ],
    "atividades-completas": [
      {
        ResponsiblePersonName: "Diego",
        activityImplementedDate: "2026-04-14",
      },
    ],
  } satisfies Record<string, Array<Record<string, unknown>>>;

  it("maps the audit activities stage concept to the real SQL field", () => {
    const concepts = getReportConceptEntries("atividades-de-auditoria");
    const stageConcept = concepts.find((concept) => concept.conceptKey === "stage");

    expect(stageConcept).toEqual(
      expect.objectContaining({
        field: "ActivityStagesDescription",
        label: {
          "pt-BR": "Estágio",
          "en-US": "Stage",
        },
      }),
    );
  });

  it("returns translated metadata for the real audit activities stage field", () => {
    const stageMeta = getFieldMeta("atividades-de-auditoria", "ActivityStagesDescription");

    expect(stageMeta).toEqual(
      expect.objectContaining({
        label: {
          "pt-BR": "Estágio",
          "en-US": "Stage",
        },
        source: "WorkflowStages.WorkflowStages_Description",
      }),
    );
  });

  it("returns curated metadata for malformed non-conformity audit aliases", () => {
    expect(getFieldMeta("nao-conformidade", "auditAuditorPerSOnName")).toEqual(
      expect.objectContaining({
        label: {
          "pt-BR": "Auditor",
          "en-US": "Auditor",
        },
      }),
    );

    expect(getFieldMeta("nao-conformidade", "auditLevelDescriPTion")).toEqual(
      expect.objectContaining({
        label: {
          "pt-BR": "Nível da auditoria",
          "en-US": "Audit level",
        },
      }),
    );
  });

  it("builds charts for audit activities using the populated stage field", () => {
    const semanticView = getReportSemanticView(
      "atividades-de-auditoria",
      [
        {
          ActivityStagesDescription: "Concluída",
          ActivityResponsiblePersonName: "Ana",
          activityTupleCreatedIn: "2026-04-14 09:00:00",
          auditDepartmentDescription: "Qualidade",
        },
        {
          ActivityStagesDescription: "Em elaboração",
          ActivityResponsiblePersonName: "Bruno",
          activityTupleCreatedIn: "2026-04-15 10:30:00",
          auditDepartmentDescription: "Qualidade",
        },
      ],
      "pt-BR",
    );

    const statusChart = semanticView.charts.find((chart) => chart.id === "status-share");

    expect(statusChart).toEqual(
      expect.objectContaining({
        chartType: "pie",
        categoryField: "ActivityStagesDescription",
        title: "Distribuição por status",
      }),
    );
  });

  it("uses activityImplementedDate as the main date concept for audit activities", () => {
    const concepts = getReportConceptEntries("atividades-de-auditoria");
    const dateConcept = concepts.find((concept) => concept.conceptKey === "date");

    expect(dateConcept).toEqual(
      expect.objectContaining({
        field: "activityImplementedDate",
        label: {
          "pt-BR": "Implementada em",
          "en-US": "Implemented on",
        },
      }),
    );
  });

  it("uses semantic concept and chart fields that exist in the mapped report rows", () => {
    for (const [reportId, rows] of Object.entries(sampleRowsByReport)) {
      const rowKeys = new Set(Object.keys(rows[0] ?? {}));
      const concepts = getReportConceptEntries(reportId);
      const semanticView = getReportSemanticView(reportId, rows, "pt-BR");

      for (const concept of concepts) {
        expect(
          rowKeys.has(concept.field),
          `Concept field "${concept.field}" should exist in ${reportId}`,
        ).toBe(true);
      }

      for (const chart of semanticView.charts) {
        if (chart.aggregated) continue;

        expect(
          rowKeys.has(chart.categoryField),
          `Chart category field "${chart.categoryField}" should exist in ${reportId}`,
        ).toBe(true);

        if (chart.dateField) {
          expect(
            rowKeys.has(chart.dateField),
            `Chart date field "${chart.dateField}" should exist in ${reportId}`,
          ).toBe(true);
        }
      }

      for (const correlation of semanticView.correlations) {
        expect(
          rowKeys.has(correlation.leftField),
          `Correlation left field "${correlation.leftField}" should exist in ${reportId}`,
        ).toBe(true);
        expect(
          rowKeys.has(correlation.rightField),
          `Correlation right field "${correlation.rightField}" should exist in ${reportId}`,
        ).toBe(true);
      }
    }
  });

  it("keeps status charts bound to real populated fields for every report that exposes status", () => {
    const reportsWithStatus = [
      "auditorias-realizadas",
      "atividades-de-auditoria",
      "nao-conformidade",
      "ocorrencias-com-e-sem-atividade",
      "ocorrencias-com-indicador",
      "ocorrencias-ff",
    ] as const;

    for (const reportId of reportsWithStatus) {
      const semanticView = getReportSemanticView(reportId, sampleRowsByReport[reportId], "pt-BR");
      const statusChart = semanticView.charts.find((chart) => chart.id === "status-share");
      const firstRow = sampleRowsByReport[reportId][0] as Record<string, unknown>;

      expect(statusChart, `Status chart should exist for ${reportId}`).toBeDefined();
      expect(
        firstRow[statusChart?.categoryField ?? ""],
        `Status field "${statusChart?.categoryField}" should be populated in ${reportId}`,
      ).toBeTruthy();
    }
  });

  it("includes a pie chart for auditorias planejadas using a real grouping field", () => {
    const semanticView = getReportSemanticView(
      "auditorias-planejadas",
      sampleRowsByReport["auditorias-planejadas"],
      "pt-BR",
    );

    expect(semanticView.charts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          chartType: "pie",
          categoryField: "Sector_Description",
        }),
      ]),
    );
  });
});
