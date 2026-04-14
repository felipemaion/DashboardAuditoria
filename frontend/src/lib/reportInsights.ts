export type ReportRecord = Record<string, unknown>;

export type FieldKind = "numeric" | "date" | "categorical";

export type KpiCard = {
  id: string;
  labelKey: "rowCount" | "numericAverage" | "fillRate" | "topCategory";
  value: string;
  detail: string;
};

export type ChartSuggestion = {
  id: string;
  chartType: "pie" | "bar" | "combo";
  title: string;
  categoryField: string;
  valueField?: string;
  dateField?: string;
};

export type CorrelationSuggestion = {
  id: string;
  leftField: string;
  rightField: string;
  rationale: string;
};

export type ReportInsights = {
  kpis: KpiCard[];
  chartSuggestions: ChartSuggestion[];
  correlationSuggestions: CorrelationSuggestion[];
};

function getSampleValues(fieldName: string, rows: ReportRecord[]): unknown[] {
  return rows
    .map((row) => row[fieldName])
    .filter((value) => value !== null && value !== undefined && value !== "");
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value);
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = Number(value.replace(",", "."));
    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }

  return null;
}

export function detectFieldKind(fieldName: string, rows: ReportRecord[]): FieldKind {
  const values = getSampleValues(fieldName, rows).slice(0, 12);

  if (values.length === 0) {
    return "categorical";
  }

  if (
    values.every(
      (value) => typeof value === "string" && value.length >= 10 && isDateString(value),
    )
  ) {
    return "date";
  }

  if (values.every((value) => toNumber(value) !== null)) {
    return "numeric";
  }

  return "categorical";
}

function formatPercent(value: number): string {
  return `${value.toFixed(0)}%`;
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function getCategoricalTop(rows: ReportRecord[], fieldName: string): [string, number] | null {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const value = row[fieldName];
    if (value === null || value === undefined || value === "") {
      continue;
    }

    const key = String(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const topEntry = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
  return topEntry ?? null;
}

export function buildReportInsights(rows: ReportRecord[]): ReportInsights {
  if (rows.length === 0) {
    return {
      kpis: [],
      chartSuggestions: [],
      correlationSuggestions: [],
    };
  }

  const fieldNames = Object.keys(rows[0] ?? {});
  const numericFields = fieldNames.filter((fieldName) => detectFieldKind(fieldName, rows) === "numeric");
  const dateFields = fieldNames.filter((fieldName) => detectFieldKind(fieldName, rows) === "date");
  const categoricalFields = fieldNames.filter(
    (fieldName) => detectFieldKind(fieldName, rows) === "categorical",
  );

  const totalCells = rows.length * Math.max(fieldNames.length, 1);
  const populatedCells = rows.reduce((accumulator, row) => {
    return (
      accumulator +
      fieldNames.filter((fieldName) => row[fieldName] !== null && row[fieldName] !== undefined && row[fieldName] !== "")
        .length
    );
  }, 0);
  const fillRate = totalCells > 0 ? (populatedCells / totalCells) * 100 : 0;

  const primaryNumericField = numericFields[0];
  const primaryCategoricalField = categoricalFields[0];
  const primaryDateField = dateFields[0];
  const primaryTopCategory = primaryCategoricalField
    ? getCategoricalTop(rows, primaryCategoricalField)
    : null;

  const averageNumericValue = primaryNumericField
    ? rows.reduce((accumulator, row) => accumulator + (toNumber(row[primaryNumericField]) ?? 0), 0) /
      Math.max(rows.length, 1)
    : null;

  const kpis: KpiCard[] = [
    {
      id: "row-count",
      labelKey: "rowCount",
      value: formatCompactNumber(rows.length),
      detail: `Dataset preview with ${fieldNames.length} fields`,
    },
    {
      id: "fill-rate",
      labelKey: "fillRate",
      value: formatPercent(fillRate),
      detail: "Non-empty cells in the current sample",
    },
  ];

  if (averageNumericValue !== null && primaryNumericField) {
    kpis.push({
      id: "numeric-average",
      labelKey: "numericAverage",
      value: averageNumericValue.toFixed(1),
      detail: `Average of ${primaryNumericField}`,
    });
  }

  if (primaryTopCategory && primaryCategoricalField) {
    kpis.push({
      id: "top-category",
      labelKey: "topCategory",
      value: primaryTopCategory[0],
      detail: `${primaryTopCategory[1]} rows on ${primaryCategoricalField}`,
    });
  }

  const chartSuggestions: ChartSuggestion[] = [];

  if (primaryCategoricalField) {
    chartSuggestions.push({
      id: "pie-share",
      chartType: "pie",
      title: `${primaryCategoricalField} share`,
      categoryField: primaryCategoricalField,
    });

    chartSuggestions.push({
      id: "bar-distribution",
      chartType: "bar",
      title: `${primaryCategoricalField} distribution`,
      categoryField: primaryCategoricalField,
      valueField: primaryNumericField,
    });
  }

  if (primaryDateField) {
    chartSuggestions.push({
      id: "combo-trend",
      chartType: "combo",
      title: `${primaryDateField} trend and volume`,
      categoryField: primaryCategoricalField ?? primaryDateField,
      dateField: primaryDateField,
      valueField: primaryNumericField,
    });
  }

  const correlationSuggestions: CorrelationSuggestion[] = [];

  if (primaryCategoricalField && primaryNumericField) {
    correlationSuggestions.push({
      id: "categorical-vs-numeric",
      leftField: primaryCategoricalField,
      rightField: primaryNumericField,
      rationale: "Compare categories against the main numeric metric to identify concentration and outliers.",
    });
  }

  if (primaryDateField && primaryNumericField) {
    correlationSuggestions.push({
      id: "date-vs-numeric",
      leftField: primaryDateField,
      rightField: primaryNumericField,
      rationale: "Track whether the core numeric metric improves or deteriorates over time.",
    });
  }

  if (primaryDateField && primaryCategoricalField) {
    correlationSuggestions.push({
      id: "date-vs-categorical",
      leftField: primaryDateField,
      rightField: primaryCategoricalField,
      rationale: "Analyze whether category mix changes across the timeline.",
    });
  }

  return {
    kpis,
    chartSuggestions,
    correlationSuggestions,
  };
}
