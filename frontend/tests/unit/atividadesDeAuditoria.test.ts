/**
 * TDD — testes de frontend para atividades-de-auditoria.
 *
 * Cobre:
 * 1. Semantic layer — aliases corrigidos, fieldMeta explícito, conceptKey "auditType",
 *    KPI "Itens abertos", 6 KPIs analíticos, colunas FK/GUID ocultas por padrão
 * 2. i18n — chaves PT-BR + EN-US para seletor temporal, KPI titles, bandas VDA, empty state
 *
 * A maioria dos testes FALHARÁ contra o código atual — esse é o estado esperado antes
 * da implementação pelo agente UX Frontend (task #9).
 */

import {
  classifyVdaBand,
  getFieldMeta,
  getReportConceptEntries,
  getReportSemanticView,
} from "../../src/lib/reportSemantics";
import { translations } from "../../src/lib/i18n";

// Rows mínimas para instanciar o semantic view sem erros
const minimalRows = [
  {
    activityCode: 1,
    activityTitle: "Ação de auditoria A",
    activityImplementedDate: "2025-11-01",
    ActivityStagesDescription: "Concluída",
    ActivityResponsiblePersonName: "Ana",
    auditDepartmentDescription: "Qualidade",
    auditSectorDescription: "Processos",
    auditTypeAuditDescription: "VDA 6.3",
    auditLevelDescription: "Nível A",
    auditIndustrialMachineDescription: "Prensa 01",
    auditScore: 88.5,
    auditStatus: 2,
    auditEndDate: "2025-10-31",
    auditPlannedDate: "2025-10-01",
    activityDeadline: "2025-10-15",
    activityPlannedDate: "2025-09-01",
    activityClosed: 1,
    activityFailed: 0,
    auditAuditorPersonName: "Carlos",
  },
  {
    activityCode: 2,
    activityTitle: "Ação de auditoria B",
    activityImplementedDate: null,
    ActivityStagesDescription: "Em elaboração",
    ActivityResponsiblePersonName: "Bruno",
    auditDepartmentDescription: "Produção",
    auditSectorDescription: "Montagem",
    auditTypeAuditDescription: "VDA 6.3",
    auditLevelDescription: "Nível B",
    auditIndustrialMachineDescription: "Prensa 02",
    auditScore: 62.0,
    auditStatus: 1,
    auditEndDate: null,
    auditPlannedDate: "2025-10-15",
    activityDeadline: "2025-10-20",
    activityPlannedDate: "2025-09-10",
    activityClosed: 0,
    activityFailed: 0,
    auditAuditorPersonName: "Diana",
  },
];

// ============================================================
// 11. R-2: Heatmap setor × nível VDA 6.3
// ============================================================

describe("atividades-de-auditoria — sector-level-heatmap-vda chart (R-2)", () => {
  it("has chart sector-level-heatmap-vda in semantic view", () => {
    const view = getReportSemanticView("atividades-de-auditoria", minimalRows, "pt-BR");
    const chart = view.charts.find((c) => c.id === "sector-level-heatmap-vda");
    expect(chart, "chart sector-level-heatmap-vda should exist").toBeDefined();
  });

  it("sector-level-heatmap-vda uses auditSectorDescription as categoryField", () => {
    const view = getReportSemanticView("atividades-de-auditoria", minimalRows, "pt-BR");
    const chart = view.charts.find((c) => c.id === "sector-level-heatmap-vda");
    expect(chart?.categoryField).toBe("auditSectorDescription");
  });

  it("sector-level-heatmap-vda uses auditLevelDescription as secondaryField", () => {
    const view = getReportSemanticView("atividades-de-auditoria", minimalRows, "pt-BR");
    const chart = view.charts.find((c) => c.id === "sector-level-heatmap-vda");
    expect(chart?.secondaryField).toBe("auditLevelDescription");
  });

  it("sector-level-heatmap-vda description mentions VDA 6.3", () => {
    const view = getReportSemanticView("atividades-de-auditoria", minimalRows, "pt-BR");
    const chart = view.charts.find((c) => c.id === "sector-level-heatmap-vda");
    expect(chart?.description).toMatch(/VDA 6\.3/);
  });

  it("sector-stage-heatmap still exists (not replaced)", () => {
    const view = getReportSemanticView("atividades-de-auditoria", minimalRows, "pt-BR");
    const chart = view.charts.find((c) => c.id === "sector-stage-heatmap");
    expect(chart, "existing sector-stage-heatmap must not be removed").toBeDefined();
  });
});

// ============================================================
// 12. R-3: score-trend substitui creation-trend
// ============================================================

describe("atividades-de-auditoria — score-trend chart (R-3)", () => {
  it("has chart score-trend in semantic view", () => {
    const view = getReportSemanticView("atividades-de-auditoria", minimalRows, "pt-BR");
    const chart = view.charts.find((c) => c.id === "score-trend");
    expect(chart, "chart score-trend should exist").toBeDefined();
  });

  it("score-trend uses auditEndDate as categoryField", () => {
    const view = getReportSemanticView("atividades-de-auditoria", minimalRows, "pt-BR");
    const chart = view.charts.find((c) => c.id === "score-trend");
    expect(chart?.categoryField).toBe("auditEndDate");
  });

  it("score-trend description mentions IATF 16949", () => {
    const view = getReportSemanticView("atividades-de-auditoria", minimalRows, "pt-BR");
    const chart = view.charts.find((c) => c.id === "score-trend");
    expect(chart?.description).toMatch(/IATF/);
  });

  it("creation-trend is replaced (no longer in semantic view)", () => {
    const view = getReportSemanticView("atividades-de-auditoria", minimalRows, "pt-BR");
    const chart = view.charts.find((c) => c.id === "creation-trend");
    expect(chart, "creation-trend should be replaced by score-trend").toBeUndefined();
  });

  it("trend-target KPI source is auditScore (not activityImplementedDate)", () => {
    const view = getReportSemanticView("atividades-de-auditoria", minimalRows, "pt-BR");
    const kpi = view.kpis.find((k) => k.id === "trend-target");
    expect(kpi).toBeDefined();
    // The tooltip must reference Audit_Score source
    expect(kpi?.tooltip).toMatch(/Audit_Score|auditScore/);
  });
});

// ============================================================
// 13. R-4: classifyVdaBand — faixas VDA 6.3
// ============================================================

describe("classifyVdaBand — faixas VDA 6.3 (R-4)", () => {
  it("returns 'A' for score >= 90", () => {
    expect(classifyVdaBand(90)).toBe("A");
    expect(classifyVdaBand(95)).toBe("A");
    expect(classifyVdaBand(100)).toBe("A");
  });

  it("returns 'B' for score in 70–89 range", () => {
    expect(classifyVdaBand(70)).toBe("B");
    expect(classifyVdaBand(80)).toBe("B");
    expect(classifyVdaBand(89)).toBe("B");
  });

  it("returns 'C' for score < 70", () => {
    expect(classifyVdaBand(69)).toBe("C");
    expect(classifyVdaBand(50)).toBe("C");
    expect(classifyVdaBand(0)).toBe("C");
  });
});

// ============================================================
// 1. SEMANTIC LAYER — conceptKey "auditType" mapeado
// ============================================================

describe("atividades-de-auditoria — semantic layer: conceitos", () => {
  it('maps conceptKey "auditType" to auditTypeAuditDescription', () => {
    const concepts = getReportConceptEntries("atividades-de-auditoria");
    const auditTypeConcept = concepts.find((c) => c.conceptKey === "auditType");

    expect(auditTypeConcept).toBeDefined();
    expect(auditTypeConcept).toEqual(
      expect.objectContaining({
        conceptKey: "auditType",
        field: "auditTypeAuditDescription",
        label: expect.objectContaining({
          "pt-BR": expect.any(String),
          "en-US": expect.any(String),
        }),
      }),
    );
  });

  it("has all 3 corrected alias concepts available via getFieldMeta", () => {
    const correctedAliases = [
      "auditAuditorPersonName",
      "auditSectorDescription",
      "auditLevelDescription",
    ];

    for (const alias of correctedAliases) {
      const meta = getFieldMeta("atividades-de-auditoria", alias);
      expect(meta, `fieldMeta for ${alias} should be defined`).toBeDefined();
      expect(
        meta?.label["pt-BR"],
        `${alias} should have PT-BR label`,
      ).toBeTruthy();
      expect(
        meta?.label["en-US"],
        `${alias} should have EN-US label`,
      ).toBeTruthy();
    }
  });
});

// ============================================================
// 2. SEMANTIC LAYER — fieldMeta explícito para campos analíticos
// ============================================================

describe("atividades-de-auditoria — semantic layer: fieldMeta analíticos", () => {
  const analyticalFields: Array<{ field: string; expectedPtBr: string; expectedEnUs: string }> = [
    { field: "activityPriority",           expectedPtBr: "Prioridade",          expectedEnUs: "Priority" },
    { field: "activityComplexity",         expectedPtBr: "Complexidade",        expectedEnUs: "Complexity" },
    // "Prazo final" / "Deadline" — UX agent's choice (concise over verbose)
    { field: "activityDeadline",           expectedPtBr: "Prazo final",         expectedEnUs: "Deadline" },
    // "Data planejada" / "Planned date" — UX agent's choice
    { field: "activityPlannedDate",        expectedPtBr: "Data planejada",      expectedEnUs: "Planned date" },
    { field: "activityCompletionLevel",    expectedPtBr: "Nível de conclusão",  expectedEnUs: "Completion level" },
    { field: "auditStatus",               expectedPtBr: "Status da auditoria", expectedEnUs: "Audit status" },
    { field: "auditTotalAnswers",          expectedPtBr: "Total de respostas",  expectedEnUs: "Total answers" },
    // "Respostas avaliadas" / "Evaluated answers" — UX agent's choice
    { field: "auditTotalAnswerAvaliation", expectedPtBr: "Respostas avaliadas", expectedEnUs: "Evaluated answers" },
    // "Score total de respostas" / "Total answer score" — UX agent's choice
    { field: "auditTotalAuditAnswerScore", expectedPtBr: "Score total de respostas", expectedEnUs: "Total answer score" },
    { field: "typeActivityDescription",   expectedPtBr: "Tipo de atividade",   expectedEnUs: "Activity type" },
    { field: "focusFactoryDescription",   expectedPtBr: "Focus Factory",       expectedEnUs: "Focus Factory" },
    // "Status de avaliação" / "Evaluation status" — UX agent's choice
    { field: "auditAnswerAvaliationStatus",expectedPtBr: "Status de avaliação", expectedEnUs: "Evaluation status" },
    { field: "activityCancellationDate",  expectedPtBr: "Data de cancelamento", expectedEnUs: "Cancellation date" },
  ];

  it.each(analyticalFields)(
    "has explicit PT-BR label '$expectedPtBr' for field $field",
    ({ field, expectedPtBr }) => {
      const meta = getFieldMeta("atividades-de-auditoria", field);
      expect(meta).toBeDefined();
      expect(meta?.label["pt-BR"]).toBe(expectedPtBr);
    },
  );

  it.each(analyticalFields)(
    "has explicit EN-US label '$expectedEnUs' for field $field",
    ({ field, expectedEnUs }) => {
      const meta = getFieldMeta("atividades-de-auditoria", field);
      expect(meta).toBeDefined();
      expect(meta?.label["en-US"]).toBe(expectedEnUs);
    },
  );
});

// ============================================================
// 3. SEMANTIC LAYER — KPI "Itens abertos" via statusField
// ============================================================

describe("atividades-de-auditoria — KPI Itens abertos", () => {
  it('renders the "open-items" KPI when statusField is configured', () => {
    const view = getReportSemanticView("atividades-de-auditoria", minimalRows, "pt-BR");
    const openItemsKpi = view.kpis.find((kpi) => kpi.id === "open-items");

    expect(openItemsKpi).toBeDefined();
    expect(openItemsKpi?.label).toBe("Itens abertos");
  });
});

// ============================================================
// 4. SEMANTIC LAYER — 6 KPIs analíticos especializados
// ============================================================

describe("atividades-de-auditoria — 6 KPIs analíticos", () => {
  const expectedKpiIds = [
    "score-by-type-level",
    "sla-15-60",
    "trend-target",
    "workflow-funnel",
    "sector-level-heatmap",
    "top-machines",
  ] as const;

  it.each(expectedKpiIds)("renders KPI '%s'", (kpiId) => {
    const view = getReportSemanticView("atividades-de-auditoria", minimalRows, "pt-BR");
    const kpi = view.kpis.find((k) => k.id === kpiId);

    expect(kpi, `KPI "${kpiId}" should be present in the semantic view`).toBeDefined();
  });

  it("KPI score-by-type-level has PT-BR and EN-US labels", () => {
    const ptView = getReportSemanticView("atividades-de-auditoria", minimalRows, "pt-BR");
    const enView = getReportSemanticView("atividades-de-auditoria", minimalRows, "en-US");

    const kpiPt = ptView.kpis.find((k) => k.id === "score-by-type-level");
    const kpiEn = enView.kpis.find((k) => k.id === "score-by-type-level");

    expect(kpiPt?.label).toBeTruthy();
    expect(kpiEn?.label).toBeTruthy();
    // Labels must differ between locales
    expect(kpiPt?.label).not.toBe(kpiEn?.label);
  });

  it("KPI sla-15-60 tooltip references 15 and 60 days", () => {
    const view = getReportSemanticView("atividades-de-auditoria", minimalRows, "pt-BR");
    const kpi = view.kpis.find((k) => k.id === "sla-15-60");

    expect(kpi?.tooltip).toMatch(/15/);
    expect(kpi?.tooltip).toMatch(/60/);
  });
});

// ============================================================
// 5. SEMANTIC LAYER — colunas FK/GUID ocultas por padrão
// ============================================================

// getDefaultHiddenColumns is now exported from reportSemantics.ts

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const semanticsModule = await import("../../src/lib/reportSemantics") as any;

describe("atividades-de-auditoria — colunas FK/GUID ocultas por padrão", () => {
  const fkGuidColumns = [
    "activityGuid",
    "auditGuid",
    "auditAnswerGuid",
    "auditAnswerSmartFormSectionFieldsCode",
    "auditAnswerSmartFormSectionsFieldsOptionsCode",
    "activityContextCode",
    "activityParentCode",
    "activityProjectCode",
    "activityEpicCode",
    "activityIssueCode",
    "activityAuditAnswerCode",
    "activitySectorCode",
    "activityCorporateDivisionCode",
    "auditContextCode",
    "auditAuditorPersonCode",
    "auditResponsiblePersonCode",
    "auditDepartmentCode",
    "auditSectorCode",
    "auditIndustrialMachineCode",
    "auditLevelCode",
  ];

  it("exports getDefaultHiddenColumns function", () => {
    expect(typeof semanticsModule.getDefaultHiddenColumns).toBe("function");
  });

  it.each(fkGuidColumns)(
    "marks FK/GUID column '%s' as hidden by default",
    (column) => {
      const hidden: string[] = semanticsModule.getDefaultHiddenColumns("atividades-de-auditoria");
      expect(
        hidden,
        `Column '${column}' should be in default hidden list`,
      ).toContain(column);
    },
  );

  it("does not hide main display columns", () => {
    const hidden: string[] = semanticsModule.getDefaultHiddenColumns("atividades-de-auditoria");

    const mainColumns = [
      "activityTitle",
      "activityImplementedDate",
      "ActivityStagesDescription",
      "ActivityResponsiblePersonName",
      "auditTypeAuditDescription",
      "auditLevelDescription",
      "auditSectorDescription",
      "auditScore",
    ];

    for (const col of mainColumns) {
      expect(
        hidden,
        `Main display column '${col}' should NOT be hidden by default`,
      ).not.toContain(col);
    }
  });
});

// ============================================================
// 6. i18n — chaves para seletor temporal
// ============================================================

describe("i18n — seletor temporal PT-BR + EN-US", () => {
  // Access as Record<string, string | undefined> since keys don't exist yet in Dictionary type
  const ptBr = translations["pt-BR"] as Record<string, string | undefined>;
  const enUs = translations["en-US"] as Record<string, string | undefined>;

  const temporalKeys = [
    { key: "periodoMes",       expectedPtBr: "Mês",      expectedEnUs: "Month" },
    { key: "periodoTrimestre", expectedPtBr: "Trimestre", expectedEnUs: "Quarter" },
    { key: "periodoYtd",       expectedPtBr: "YTD",      expectedEnUs: "YTD" },
  ] as const;

  it.each(temporalKeys)(
    "has PT-BR key '$key' = '$expectedPtBr'",
    ({ key, expectedPtBr }) => {
      expect(ptBr[key]).toBe(expectedPtBr);
    },
  );

  it.each(temporalKeys)(
    "has EN-US key '$key' = '$expectedEnUs'",
    ({ key, expectedEnUs }) => {
      expect(enUs[key]).toBe(expectedEnUs);
    },
  );
});

// ============================================================
// 7. i18n — bandas VDA 6.3 (A/B/C)
// ============================================================

describe("i18n — bandas VDA 6.3", () => {
  const ptBr = translations["pt-BR"] as Record<string, string | undefined>;
  const enUs = translations["en-US"] as Record<string, string | undefined>;

  it("has PT-BR label for VDA band A (score ≥ 90%)", () => {
    expect(ptBr["vdaBandA"]).toBeTruthy();
    expect(ptBr["vdaBandA"]).toMatch(/A/);
  });

  it("has PT-BR label for VDA band B (score 80–89%)", () => {
    expect(ptBr["vdaBandB"]).toBeTruthy();
    expect(ptBr["vdaBandB"]).toMatch(/B/);
  });

  it("has PT-BR label for VDA band C (score < 80%)", () => {
    expect(ptBr["vdaBandC"]).toBeTruthy();
    expect(ptBr["vdaBandC"]).toMatch(/C/);
  });

  it("has EN-US equivalents for all VDA bands", () => {
    expect(enUs["vdaBandA"]).toBeTruthy();
    expect(enUs["vdaBandB"]).toBeTruthy();
    expect(enUs["vdaBandC"]).toBeTruthy();
  });
});

// ============================================================
// 8. i18n — empty state quando activityImplementedDate = NULL
// ============================================================

describe("i18n — empty state implementada em NULL", () => {
  const ptBr = translations["pt-BR"] as Record<string, string | undefined>;
  const enUs = translations["en-US"] as Record<string, string | undefined>;

  it("has PT-BR empty state label for null implementation date", () => {
    expect(ptBr["emptyImplementedDate"]).toBeTruthy();
  });

  it("has EN-US empty state label for null implementation date", () => {
    expect(enUs["emptyImplementedDate"]).toBeTruthy();
  });
});

// ============================================================
// 9. i18n — títulos executivos dos 6 KPIs
// ============================================================

describe("i18n — títulos executivos dos KPIs", () => {
  const ptBr = translations["pt-BR"] as Record<string, string | undefined>;
  const enUs = translations["en-US"] as Record<string, string | undefined>;

  const kpiTitleKeys = [
    "kpiScoreByTypeLevel",
    "kpiSla",
    "kpiTrend",
    "kpiFunnel",
    "kpiHeatmap",
    "kpiTopMachines",
  ] as const;

  it.each(kpiTitleKeys)("has PT-BR title for KPI key '%s'", (key) => {
    expect(ptBr[key]).toBeTruthy();
  });

  it.each(kpiTitleKeys)("has EN-US title for KPI key '%s'", (key) => {
    expect(enUs[key]).toBeTruthy();
  });
});

// ============================================================
// 10. REGRESSÃO — aliases corrigidos nos conceitos do relatório
//     (atividades-de-auditoria NÃO deve ter aliases com typo)
// ============================================================

describe("atividades-de-auditoria — ausência de aliases com typo nos conceitos", () => {
  it("does not use auditAuditorPerSOnName in concepts", () => {
    const concepts = getReportConceptEntries("atividades-de-auditoria");
    const fields = concepts.map((c) => c.field);
    expect(fields).not.toContain("auditAuditorPerSOnName");
  });

  it("does not use auditSECtorDescription in concepts", () => {
    const concepts = getReportConceptEntries("atividades-de-auditoria");
    const fields = concepts.map((c) => c.field);
    expect(fields).not.toContain("auditSECtorDescription");
  });

  it("does not use auditLevelDescriPTion in concepts", () => {
    const concepts = getReportConceptEntries("atividades-de-auditoria");
    const fields = concepts.map((c) => c.field);
    expect(fields).not.toContain("auditLevelDescriPTion");
  });
});
