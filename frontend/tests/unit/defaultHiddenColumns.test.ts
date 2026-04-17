/**
 * TDD — testes de regressão garantindo que o relatório auditorias-planejadas
 * tenha colunas técnicas escondidas por padrão na grid do explorador.
 *
 * Bug atual: `defaultHiddenColumnsByReport["auditorias-planejadas"]` não
 * existe — todos os campos técnicos (Guid, TupleExcluded/CreatedIn/ModifiedIn,
 * UserModification, *CodeCode) ficam visíveis na visão padrão, poluindo a
 * UI executiva.
 */

import { getDefaultHiddenColumns } from "../../src/lib/reportSemantics";

describe("getDefaultHiddenColumns(\"auditorias-planejadas\")", () => {
  const hidden = getDefaultHiddenColumns("auditorias-planejadas");

  it("returns a non-empty list of hidden columns", () => {
    expect(hidden.length).toBeGreaterThan(0);
  });

  describe("hides identifier-style fields", () => {
    it.each(["AuditingPlanningGuid"])("hides %s", (field) => {
      expect(hidden).toContain(field);
    });
  });

  describe("hides tuple metadata fields", () => {
    it.each([
      "AuditingPlanningTupleExcluded",
      "AuditingPlanningTupleCreatedIn",
      "AuditingPlanningTupleModifiedIn",
    ])("hides %s", (field) => {
      expect(hidden).toContain(field);
    });
  });

  describe("hides modification audit fields", () => {
    it.each(["AuditingPlanningUserModification"])("hides %s", (field) => {
      expect(hidden).toContain(field);
    });
  });

  describe("hides redundant *CodeCode reference fields", () => {
    it.each([
      "AuditingPlanningDepartmentCodeCode",
      "AuditingPlanningTypeAuditCodeCode",
      "AuditingPlanningAuditLevelCodeCode",
      "ResponsibleCode",
      "CompanyCode",
      "ContextCode",
    ])("hides %s", (field) => {
      expect(hidden).toContain(field);
    });
  });
});
