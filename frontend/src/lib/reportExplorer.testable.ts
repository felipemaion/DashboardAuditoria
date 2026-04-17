import type { Locale } from "./i18n";
import type { FieldMeta } from "./reportSemantics";
import { getFieldMeta, getReportConceptEntries } from "./reportSemantics";

export type ReportRecord = Record<string, unknown>;

export type FilterDefinition = {
  field: string;
  label: string;
  description: string;
  source: string;
  options: string[];
};

export type ActiveFilter = Record<string, string>;
export type DateRangeFilter = {
  field: string;
  from: string;
  to: string;
};

export type CrossReportInsight = {
  id: string;
  relatedReportId: string;
  relatedReportTitle: string;
  conceptKey: string;
  conceptLabel: string;
  selectedField: string;
  relatedField: string;
  overlapCount: number;
  overlapValues: string[];
  summary: string;
};

type RelatedReportData = {
  reportId: string;
  title: string;
  rows: ReportRecord[];
};

function normalizeString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeAliasForDisplay(alias: string): string {
  return alias
    .replace(/PerSOn/g, "Person")
    .replace(/DescriPTion/g, "Description")
    .replace(/SECtor/g, "Sector")
    .replace(/mAX_/g, "Max_");
}

function getFieldLabel(fieldMeta: FieldMeta | undefined, locale: Locale, fallback: string): string {
  if (fieldMeta?.label[locale]) {
    return fieldMeta.label[locale];
  }

  const normalizedFallback = normalizeAliasForDisplay(fallback);

  const humanizedFallback = normalizedFallback
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (character) => character.toUpperCase());

  if (locale === "en-US") {
    return humanizedFallback;
  }

  const phraseDictionary: Array<[RegExp, string]> = [
    [/\bcustomer plant\b/gi, "planta do cliente"],
    [/\bcustomer class\b/gi, "classe do cliente"],
    [/\bproduct family\b/gi, "família do produto"],
    [/\bimmediate cause\b/gi, "causa imediata"],
    [/\baction implemented\b/gi, "ação implementada"],
    [/\bimmediate action\b/gi, "ação imediata"],
    [/\bwho detected\b/gi, "quem detectou"],
    [/\bwhere detected\b/gi, "onde foi detectado"],
    [/\bsafe launch\b/gi, "lançamento seguro"],
    [/\broot cause\b/gi, "causa raiz"],
    [/\bpermanent corrective action\b/gi, "ação corretiva permanente"],
    [/\bcustomer doc\b./gi, "documento do cliente"],
    [/\bcustomer doc\b/gi, "documento do cliente"],
    [/\bcost customer document\b/gi, "custo do documento do cliente"],
    [/\bcosts origin from failure\b/gi, "custos originados pela falha"],
    [/\bincidents type\b/gi, "tipo de incidente"],
    [/\blaunch or serie\b/gi, "lançamento ou série"],
    [/\bmajor event\b/gi, "evento maior"],
    [/\bmachine station resp\b/gi, "máquina estação responsável"],
    [/\blink actv\b/gi, "link de atividades"],
    [/\bactivity open\b/gi, "atividades abertas"],
    [/\bactivity delay\b/gi, "atividades em atraso"],
    [/\bqty founded\b/gi, "quantidade encontrada"],
    [/\bworkflow stages\b/gi, "etapas do workflow"],
    [/\bmain workflow stages\b/gi, "etapa principal do workflow"],
    [/\brequester person name\b/gi, "nome do solicitante"],
    [/\bresponsible person name\b/gi, "nome do responsável"],
    [/\bauditing planning\b/gi, "planejamento de auditoria"],
    [/\baudit department description\b/gi, "departamento da auditoria"],
    [/\baudit sector description\b/gi, "setor da auditoria"],
    [/\baudit industrial machine description\b/gi, "máquina industrial da auditoria"],
    [/\baudit level description\b/gi, "nível da auditoria"],
    [/\baudit type audit description\b/gi, "tipo de auditoria"],
    [/\baudit code\b/gi, "código da auditoria"],
    [/\baudit company corporate name\b/gi, "empresa da auditoria"],
    [/\baudit auditor person name\b/gi, "auditor"],
    [/\baudit responsible person name\b/gi, "responsável pela auditoria"],
    [/\bactivity title\b/gi, "título da atividade"],
    [/\bactivity company corporate name\b/gi, "empresa da atividade"],
    [/\bactivity project name\b/gi, "projeto da atividade"],
    [/\bactivity issue description\b/gi, "issue da atividade"],
    [/\bactivity release description\b/gi, "release da atividade"],
    [/\bactivity requester person name\b/gi, "solicitante da ação"],
    [/\bactivity responsible person name\b/gi, "responsável pela ação"],
    [/\bdocument number\b/gi, "número do documento"],
    [/\blast name\b/gi, "sobrenome"],
    [/\bplanned date\b/gi, "data planejada"],
    [/\breplanned date\b/gi, "data replanejada"],
    [/\bimplemented date\b/gi, "data de implementação"],
    [/\bissue date\b/gi, "data da ocorrência"],
    [/\bcompany corporate name\b/gi, "nome corporativo da empresa"],
  ];

  let translatedFallback = humanizedFallback.toLowerCase();
  for (const [pattern, replacement] of phraseDictionary) {
    translatedFallback = translatedFallback.replace(pattern, replacement);
  }

  const dictionary: Record<string, string> = {
    activity: "ação",
    actions: "ações",
    action: "ação",
    requester: "solicitante",
    request: "solicitação",
    responsible: "responsável",
    owner: "responsável",
    person: "pessoa",
    name: "nome",
    names: "nomes",
    title: "título",
    detail: "detalhe",
    details: "detalhes",
    description: "descrição",
    date: "data",
    created: "criada",
    create: "criar",
    implemented: "implementada",
    implementation: "implementação",
    company: "empresa",
    corporate: "corporativa",
    document: "documento",
    number: "número",
    department: "departamento",
    sector: "setor",
    stage: "estágio",
    status: "status",
    audit: "auditoria",
    audits: "auditorias",
    auditing: "auditoria",
    auditor: "auditor",
    type: "tipo",
    code: "código",
    level: "nível",
    occurrence: "ocorrência",
    occurrences: "ocorrências",
    indicator: "indicador",
    indicators: "indicadores",
    focus: "foco",
    factory: "fábrica",
    customer: "cliente",
    plant: "planta",
    family: "família",
    immediate: "imediata",
    corrective: "corretiva",
    permanent: "permanente",
    launch: "lançamento",
    serie: "série",
    series: "série",
    linkage: "vínculo",
    comments: "comentários",
    delay: "atraso",
    delayed: "atrasadas",
    qty: "quantidade",
    found: "encontrada",
    station: "estação",
    machine: "máquina",
    industrial: "industrial",
    planning: "planejamento",
    planned: "planejada",
    start: "início",
    end: "fim",
    origin: "origem",
    failure: "falha",
    excluded: "excluído",
    excluding: "excluindo",
    score: "pontuação",
    answer: "resposta",
    answers: "respostas",
    result: "resultado",
    cause: "causa",
    causes: "causas",
    reason: "motivo",
    reasons: "motivos",
    frequency: "frequência",
    release: "release",
    issue: "issue",
    project: "projeto",
    epic: "épico",
    schedule: "agenda",
    workflow: "workflow",
    main: "principal",
    workflowstages: "etapas do workflow",
    attendance: "atendimento",
    requesterperson: "solicitante",
    responsibleperson: "responsável",
    tuple: "registro",
    modified: "atualizada",
    last: "último",
    cost: "custo",
    costs: "custos",
    from: "de",
    for: "para",
    in: "em",
    modifiedin: "atualizada em",
    createdin: "criada em",
    tuplecreatedin: "criada em",
    tuplemodifiedin: "atualizada em",
    planneddate: "data planejada",
    replanneddate: "data replanejada",
    implementeddate: "data de implementação",
    requesterpersonname: "solicitante da ação",
    responsiblepersonname: "responsável pela ação",
  };

  return translatedFallback
    .split(" ")
    .map((word) => {
      const normalizedWord = word.toLowerCase();
      return dictionary[normalizedWord] ?? normalizedWord;
    })
    .join(" ")
    .replace(/^./, (character) => character.toUpperCase());
}

function getFieldDescription(fieldMeta: FieldMeta | undefined, locale: Locale): string {
  if (fieldMeta?.description[locale]) {
    return fieldMeta.description[locale];
  }

  return locale === "pt-BR"
    ? "Use este campo para filtrar o relatório."
    : "Use this field to filter the report.";
}

function formatConceptValue(value: string): string {
  return value.length > 36 ? `${value.slice(0, 33)}...` : value;
}

export function buildFilterDefinitions(
  reportId: string,
  rows: ReportRecord[],
  locale: Locale,
): FilterDefinition[] {
  if (rows.length === 0) {
    return [];
  }

  const candidateFields = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      candidateFields.add(key);
    }
  }

  return [...candidateFields]
    .map((field) => {
      const options = [...new Set(rows.map((row) => normalizeString(row[field])).filter(Boolean))];

      if (options.length < 2 || options.length > 12) {
        return null;
      }

      const fieldMeta = getFieldMeta(reportId, field);
      return {
        field,
        label: getFieldLabel(fieldMeta, locale, field),
        description: getFieldDescription(fieldMeta, locale),
        source: fieldMeta?.source ?? field,
        options: options.sort((left, right) => left.localeCompare(right)),
      };
    })
    .filter((definition): definition is FilterDefinition => definition !== null)
    .sort((left, right) => left.label.localeCompare(right.label))
    .slice(0, 6);
}

export function applyReportFilters(rows: ReportRecord[], filters: ActiveFilter): ReportRecord[] {
  return applyReportFiltersWithDateRange(rows, filters);
}

function normalizeDateValue(value: unknown): string {
  const normalized = normalizeString(value);
  return normalized ? normalized.slice(0, 10) : "";
}

export function applyReportFiltersWithDateRange(
  rows: ReportRecord[],
  filters: ActiveFilter,
  dateRange?: DateRangeFilter | null,
): ReportRecord[] {
  const activeEntries = Object.entries(filters).filter(([, value]) => value);
  const hasDateRange = Boolean(dateRange && dateRange.field && (dateRange.from || dateRange.to));

  if (activeEntries.length === 0 && !hasDateRange) {
    return rows;
  }

  return rows.filter((row) => {
    const matchesDiscreteFilters = activeEntries.every(
      ([field, expected]) => normalizeString(row[field]) === expected,
    );

    if (!matchesDiscreteFilters) {
      return false;
    }

    if (!hasDateRange || !dateRange) {
      return true;
    }

    const currentDate = normalizeDateValue(row[dateRange.field]);
    if (!currentDate) {
      return false;
    }

    if (dateRange.from && currentDate < dateRange.from) {
      return false;
    }

    if (dateRange.to && currentDate > dateRange.to) {
      return false;
    }

    return true;
  });
}

export function isTechnicalField(field: string, rows: ReportRecord[]): boolean {
  if (/(?:Id|ID|Guid|UUID|guid|uuid)$/.test(field)) {
    return true;
  }

  if (/Tuple|UserModification|DocumentNumber/.test(field)) {
    return true;
  }

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const sampleValues = rows.slice(0, 20).map((row) => String(row[field] ?? "")).filter(Boolean);
  if (sampleValues.length > 0 && sampleValues.every((v) => uuidPattern.test(v))) {
    return true;
  }

  if ((field.endsWith("Id") || field.endsWith("_id")) && sampleValues.length > 0) {
    const numericIdPattern = /^\d+$/;
    if (sampleValues.every((v) => numericIdPattern.test(v))) {
      return true;
    }
  }

  return false;
}

export function paginateRows(rows: ReportRecord[], page: number, pageSize: number): ReportRecord[] {
  const start = Math.max(0, (page - 1) * pageSize);
  return rows.slice(start, start + pageSize);
}

export function buildCsv(rows: ReportRecord[]): string {
  if (rows.length === 0) {
    return "";
  }

  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escapeCell = (value: unknown) => `"${String(value ?? "").split('"').join('""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(",")),
  ];

  return lines.join("\n");
}

export function buildCrossReportInsights(
  selectedReportId: string,
  selectedRows: ReportRecord[],
  relatedReports: RelatedReportData[],
  locale: Locale,
): CrossReportInsight[] {
  if (selectedRows.length === 0) {
    return [];
  }

  const selectedConcepts = getReportConceptEntries(selectedReportId);
  const results: CrossReportInsight[] = [];

  for (const relatedReport of relatedReports) {
    if (relatedReport.reportId === selectedReportId || relatedReport.rows.length === 0) {
      continue;
    }

    const relatedConcepts = getReportConceptEntries(relatedReport.reportId);

    for (const selectedConcept of selectedConcepts) {
      const relatedConcept = relatedConcepts.find((entry) => entry.conceptKey === selectedConcept.conceptKey);
      if (!relatedConcept) {
        continue;
      }

      const selectedValues = new Set(
        selectedRows.map((row) => normalizeString(row[selectedConcept.field])).filter(Boolean),
      );
      const relatedValues = new Set(
        relatedReport.rows.map((row) => normalizeString(row[relatedConcept.field])).filter(Boolean),
      );
      const overlapValues = [...selectedValues].filter((value) => relatedValues.has(value)).slice(0, 3);

      if (overlapValues.length === 0) {
        continue;
      }

      const conceptLabel = selectedConcept.label[locale];
      const selectedFieldMeta = getFieldMeta(selectedReportId, selectedConcept.field);
      const relatedFieldMeta = getFieldMeta(relatedReport.reportId, relatedConcept.field);
      const selectedFieldLabel = getFieldLabel(selectedFieldMeta, locale, selectedConcept.field);
      const relatedFieldLabel = getFieldLabel(relatedFieldMeta, locale, relatedConcept.field);

      results.push({
        id: `${selectedReportId}-${relatedReport.reportId}-${selectedConcept.conceptKey}`,
        relatedReportId: relatedReport.reportId,
        relatedReportTitle: relatedReport.title,
        conceptKey: selectedConcept.conceptKey,
        conceptLabel,
        selectedField: selectedConcept.field,
        relatedField: relatedConcept.field,
        overlapCount: overlapValues.length,
        overlapValues,
        summary:
          locale === "pt-BR"
            ? `${conceptLabel} conecta este relatório com ${relatedReport.title}. Há valores em comum como ${overlapValues
                .map(formatConceptValue)
                .join(", ")} entre ${selectedFieldLabel} e ${relatedFieldLabel}.`
            : `${conceptLabel} connects this report to ${relatedReport.title}. Shared values such as ${overlapValues
                .map(formatConceptValue)
                .join(", ")} appear across ${selectedFieldLabel} and ${relatedFieldLabel}.`,
      });
    }
  }

  return results
    .sort((left, right) => right.overlapCount - left.overlapCount)
    .slice(0, 8);
}
