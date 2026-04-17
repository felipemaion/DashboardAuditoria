/**
 * TDD — testes de regressão para a heurística `isTechnicalField`.
 *
 * Hoje a função vive em `frontend/src/components/ReportExplorer.tsx:241-260`
 * e cobre apenas sufixos `Id|ID|Guid|UUID` e padrões UUID/numéricos.
 *
 * Para o relatório auditorias-planejadas, há campos técnicos que ESCAPAM
 * dessa heurística e poluem a UI executiva:
 *   - `AuditingPlanningTupleExcluded` (sufixo `Excluded`, contém `Tuple`)
 *   - `AuditingPlanningUserModification` (sufixo `Modification`)
 *   - `ResponsibleDocumentNumber` (sufixo `Number`)
 *
 * Estes testes exigem que a heurística reconheça os marcadores `Tuple`,
 * `UserModification` e `DocumentNumber` em qualquer posição do nome, e que
 * a função seja exportada via `reportExplorer.testable.ts` para testabilidade
 * (atualmente está privada ao componente — o import falhará legitimamente).
 */

import { isTechnicalField } from "../../src/lib/reportExplorer.testable";

describe("isTechnicalField", () => {
  it("flags fields containing 'Tuple' as technical", () => {
    expect(isTechnicalField("AuditingPlanningTupleExcluded", [])).toBe(true);
    expect(isTechnicalField("AuditingPlanningTupleCreatedIn", [])).toBe(true);
    expect(isTechnicalField("AuditingPlanningTupleModifiedIn", [])).toBe(true);
  });

  it("flags fields containing 'UserModification' as technical", () => {
    expect(isTechnicalField("AuditingPlanningUserModification", [])).toBe(true);
    expect(isTechnicalField("AuditUserModification", [])).toBe(true);
  });

  it("flags fields containing 'DocumentNumber' as technical (PII proxy)", () => {
    expect(isTechnicalField("ResponsibleDocumentNumber", [])).toBe(true);
    expect(isTechnicalField("AuditorDocumentNumber", [])).toBe(true);
  });

  it("still preserves the original Guid/Id heuristic", () => {
    expect(isTechnicalField("AuditingPlanningGuid", [])).toBe(true);
    expect(isTechnicalField("Activity_id", [{ Activity_id: "42" }])).toBe(true);
  });

  it("does not flag descriptive business fields as technical", () => {
    expect(isTechnicalField("AuditingPlanningPlannedDate", [])).toBe(false);
    expect(isTechnicalField("CompanyCorporateName", [])).toBe(false);
    expect(isTechnicalField("ResponsibleName", [])).toBe(false);
    expect(isTechnicalField("Sector_Description", [])).toBe(false);
  });
});
