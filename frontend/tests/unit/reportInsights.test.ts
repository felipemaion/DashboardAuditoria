import {
  buildReportInsights,
  detectFieldKind,
  type ReportRecord,
} from "../../src/lib/reportInsights";

describe("reportInsights", () => {
  it("detects numeric, date and categorical fields", () => {
    const rows: ReportRecord[] = [
      {
        AuditDate: "2026-04-10",
        AuditScore: "85.5",
        Company: "Magna",
        Status: "Closed",
      },
    ];

    expect(detectFieldKind("AuditDate", rows)).toBe("date");
    expect(detectFieldKind("AuditScore", rows)).toBe("numeric");
    expect(detectFieldKind("Company", rows)).toBe("categorical");
  });

  it("builds kpis, chart suggestions and correlation suggestions", () => {
    const rows: ReportRecord[] = [
      {
        AuditDate: "2026-04-10",
        AuditScore: 88,
        Company: "Magna",
        Status: "Closed",
      },
      {
        AuditDate: "2026-04-11",
        AuditScore: 91,
        Company: "Magna",
        Status: "Open",
      },
      {
        AuditDate: "2026-04-12",
        AuditScore: 79,
        Company: "Cosma",
        Status: "Closed",
      },
    ];

    const insights = buildReportInsights(rows);

    expect(insights.kpis[0]?.value).toBe("3");
    expect(insights.chartSuggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ chartType: "pie" }),
        expect.objectContaining({ chartType: "bar" }),
        expect.objectContaining({ chartType: "combo" }),
      ]),
    );
    expect(insights.correlationSuggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          leftField: "Company",
          rightField: "AuditScore",
        }),
      ]),
    );
  });
});
