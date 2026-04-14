import { render, screen } from "@testing-library/react";

import { ReportCharts } from "../../src/components/ReportCharts";
import { translations } from "../../src/lib/i18n";

describe("ReportCharts", () => {
  it("resets the pie grouping when the report changes and the previous grouping is no longer valid", () => {
    const labels = translations["pt-BR"];
    const suggestion = {
      id: "status-share",
      chartType: "pie" as const,
      title: "Distribuição por status",
      description: "Mostra a distribuição por status.",
      categoryField: "ActivityStagesDescription",
    };

    const { rerender } = render(
      <ReportCharts
        reportId="atividades-de-auditoria"
        rows={[
          {
            ActivityStagesDescription: "Concluída",
            auditDepartmentDescription: "Qualidade",
          },
          {
            ActivityStagesDescription: "Em elaboração",
            auditDepartmentDescription: "Processos",
          },
        ]}
        suggestion={suggestion}
        labels={labels}
        locale="pt-BR"
      />,
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("ActivityStagesDescription");

    rerender(
      <ReportCharts
        reportId="nao-conformidade"
        rows={[
          {
            ActivityStagesDescription: "Em análise",
            ActivityResponsiblePersonName: "Ana",
          },
          {
            ActivityStagesDescription: "Concluída",
            ActivityResponsiblePersonName: "Bruno",
          },
        ]}
        suggestion={suggestion}
        labels={labels}
        locale="pt-BR"
      />,
    );

    expect(screen.getByRole("combobox")).toHaveValue("ActivityStagesDescription");
    expect(screen.getByText(/em análise/i)).toBeInTheDocument();
  });
});
