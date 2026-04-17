/**
 * TDD — testes de regressão garantindo que todo `focusField` definido em
 * `reportSemantics.ts` exista no `reportFieldInventory` correspondente.
 *
 * Bug atual: `auditorias-planejadas` define `focusField: "Sector_Description"`
 * mas o inventário do mesmo relatório NÃO contém `Sector_Description`. Isto
 * faz com que o KPI "top-focus" e o chart "focus-distribution" sejam
 * silenciosamente vazios em produção.
 *
 * Estes testes parseiam o arquivo fonte para extrair as duas estruturas e
 * cruzá-las — falham até que cada `focusField` esteja presente no inventário
 * do seu relatório.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SOURCE_PATH = resolve(__dirname, "../../src/lib/reportSemantics.ts");
const sourceText = readFileSync(SOURCE_PATH, "utf-8");

function extractInventory(reportId: string): string[] {
  const blockPattern = new RegExp(
    `"${reportId}":\\s*\\{([\\s\\S]*?)\\n\\s{2}\\}`,
    "m",
  );
  const match = sourceText
    .slice(sourceText.indexOf("const reportFieldInventory"))
    .match(blockPattern);
  if (!match) {
    return [];
  }
  const body = match[1];
  const keys: string[] = [];
  const keyPattern = /^\s{4}([A-Za-z_][A-Za-z0-9_]*)\s*:/gm;
  let keyMatch: RegExpExecArray | null;
  while ((keyMatch = keyPattern.exec(body)) !== null) {
    keys.push(keyMatch[1]);
  }
  return keys;
}

function extractReportsWithFocusField(): Array<{ reportId: string; focusField: string }> {
  const semanticsStart = sourceText.indexOf("const reportSemantics");
  const semanticsBlock = sourceText.slice(semanticsStart);
  const definitionPattern =
    /"([a-z0-9-]+)":\s*createDefinition\(\{([\s\S]*?)\n\s{2}\}\)/g;
  const found: Array<{ reportId: string; focusField: string }> = [];
  let definitionMatch: RegExpExecArray | null;
  while ((definitionMatch = definitionPattern.exec(semanticsBlock)) !== null) {
    const reportId = definitionMatch[1];
    const body = definitionMatch[2];
    const focusFieldMatch = body.match(/focusField:\s*"([^"]+)"/);
    if (focusFieldMatch) {
      found.push({ reportId, focusField: focusFieldMatch[1] });
    }
  }
  return found;
}

describe("reportSemantics focusField vs reportFieldInventory", () => {
  it("extracts the auditorias-planejadas inventory keys (smoke test)", () => {
    const keys = extractInventory("auditorias-planejadas");
    expect(keys.length).toBeGreaterThan(5);
    expect(keys).toContain("AuditingPlanningCode");
  });

  it("extracts at least one report with focusField (smoke test)", () => {
    const found = extractReportsWithFocusField();
    expect(found.length).toBeGreaterThan(0);
    expect(found.some((entry) => entry.reportId === "auditorias-planejadas")).toBe(
      true,
    );
  });

  it("focusField of auditorias-planejadas must exist in its inventory", () => {
    const inventory = extractInventory("auditorias-planejadas");
    const found = extractReportsWithFocusField().find(
      (entry) => entry.reportId === "auditorias-planejadas",
    );
    expect(found).toBeDefined();
    const focusField = found!.focusField;
    expect(
      inventory.includes(focusField),
      `focusField "${focusField}" definido para "auditorias-planejadas" deve existir em reportFieldInventory["auditorias-planejadas"] — KPI/chart focado ficaria vazio sem isso`,
    ).toBe(true);
  });

  it("every report with focusField must have it present in its inventory", () => {
    const reportsWithFocusField = extractReportsWithFocusField();
    const offenders: Array<{ reportId: string; focusField: string }> = [];

    for (const { reportId, focusField } of reportsWithFocusField) {
      const inventory = extractInventory(reportId);
      if (inventory.length === 0) {
        continue;
      }
      if (!inventory.includes(focusField)) {
        offenders.push({ reportId, focusField });
      }
    }

    expect(
      offenders,
      `Relatórios com focusField ausente do inventário: ${JSON.stringify(offenders)}`,
    ).toEqual([]);
  });
});
