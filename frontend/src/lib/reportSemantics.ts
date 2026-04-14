import type { Locale } from "./i18n";
import type { ReportRecord } from "./reportInsights";

type LocalizedText = Record<Locale, string>;

export type ReportConceptKey =
  | "company"
  | "auditType"
  | "department"
  | "sector"
  | "owner"
  | "stage"
  | "date"
  | "focusFactory"
  | "occurrenceStatus"
  | "champion"
  | "indicator"
  | "occurrenceType";

export type FieldMeta = {
  label: LocalizedText;
  description: LocalizedText;
  source: string;
};

export type ReportConceptEntry = {
  conceptKey: ReportConceptKey;
  field: string;
  label: LocalizedText;
};

type SemanticKpi = {
  id: string;
  label: LocalizedText;
  description: LocalizedText;
  source: string;
  compute: (rows: ReportRecord[], locale: Locale) => string;
};

type SemanticChart = {
  id: string;
  chartType: "pie" | "bar" | "combo";
  title: LocalizedText;
  description: LocalizedText;
  categoryField: string;
  valueField?: string;
  dateField?: string;
};

type SemanticCorrelation = {
  id: string;
  leftField: string;
  rightField: string;
  rationale: LocalizedText;
};

export type ReportSemanticView = {
  overview: string;
  kpis: Array<{
    id: string;
    label: string;
    value: string;
    detail: string;
    tooltip: string;
  }>;
  charts: Array<{
    id: string;
    chartType: "pie" | "bar" | "combo";
    title: string;
    description: string;
    categoryField: string;
    valueField?: string;
    dateField?: string;
  }>;
  correlations: Array<{
    id: string;
    leftField: string;
    rightField: string;
    rationale: string;
  }>;
  fieldMeta: Record<string, FieldMeta>;
};

type ReportSemanticDefinition = {
  title: LocalizedText;
  overview: LocalizedText;
  fieldMeta: Record<string, FieldMeta>;
  concepts: ReportConceptEntry[];
  kpis: SemanticKpi[];
  charts: SemanticChart[];
  correlations: SemanticCorrelation[];
};

function normalizeString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeFieldKey(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

function countWhere(rows: ReportRecord[], predicate: (row: ReportRecord) => boolean): number {
  return rows.filter(predicate).length;
}

function uniqueCount(rows: ReportRecord[], fieldName: string): number {
  return new Set(rows.map((row) => normalizeString(row[fieldName])).filter(Boolean)).size;
}

function topCategory(rows: ReportRecord[], fieldName: string): string {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const value = normalizeString(row[fieldName]);
    if (!value) {
      continue;
    }
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const winner = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
  return winner ? `${winner[0]} (${winner[1]})` : "-";
}

function countOpenLike(rows: ReportRecord[], fieldName: string): number {
  const openTokens = ["open", "aberto", "pendente", "andamento", "backlog"];
  return countWhere(rows, (row) =>
    openTokens.some((token) => normalizeString(row[fieldName]).toLowerCase().includes(token)),
  );
}

function fieldMeta(labelPt: string, labelEn: string, descriptionPt: string, descriptionEn: string, source: string): FieldMeta {
  return {
    label: { "pt-BR": labelPt, "en-US": labelEn },
    description: { "pt-BR": descriptionPt, "en-US": descriptionEn },
    source,
  };
}

function humanizeAlias(alias: string): { pt: string; en: string } {
  const tokens = alias
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  const dictionaryPt: Record<string, string> = {
    activity: "atividade",
    activities: "atividades",
    audit: "auditoria",
    auditing: "auditoria",
    planning: "planejamento",
    plan: "plano",
    code: "código",
    description: "descrição",
    detail: "detalhe",
    title: "título",
    company: "empresa",
    corporate: "corporativa",
    name: "nome",
    person: "pessoa",
    responsible: "responsável",
    requester: "solicitante",
    department: "departamento",
    sector: "setor",
    machine: "máquina",
    industrial: "industrial",
    level: "nível",
    type: "tipo",
    issue: "issue",
    occurrence: "ocorrência",
    causes: "causas",
    cause: "causa",
    answer: "resposta",
    answers: "respostas",
    option: "opção",
    options: "opções",
    section: "seção",
    sections: "seções",
    smart: "smart",
    form: "formulário",
    score: "pontuação",
    status: "status",
    date: "data",
    start: "início",
    end: "fim",
    planned: "planejada",
    replanned: "replanejada",
    implemented: "implementada",
    created: "criada",
    modified: "atualizada",
    excluded: "excluída",
    guid: "guid",
    frequency: "frequência",
    indicator: "indicador",
    attendance: "atendimento",
    release: "release",
    project: "projeto",
    epic: "épico",
    schedule: "agenda",
    focus: "foco",
    factory: "fábrica",
    objective: "objetivo",
    functional: "funcionais",
    requirements: "requisitos",
    business: "negócio",
    rule: "regra",
    acceptance: "aceite",
    criteria: "critérios",
    order: "ordem",
    stack: "stack",
    amount: "quantidade",
    result: "resultado",
    risk: "risco",
    effort: "esforço",
    class: "classe",
    customer: "cliente",
    plant: "planta",
    product: "produto",
    family: "família",
    defect: "defeito",
    side: "lado",
    shift: "turno",
    comments: "comentários",
    link: "link",
    private: "privada",
    archived: "arquivada",
    failed: "falhou",
    corrective: "corretiva",
    action: "ação",
    permanent: "permanente",
    immediate: "imediata",
    launch: "lançamento",
    serie: "série",
    major: "maior",
    event: "evento",
    priority: "prioridade",
    root: "raiz",
    workflow: "workflow",
    stages: "etapas",
    stage: "etapa",
    context: "contexto",
    last: "última",
    update: "atualização",
    online: "online",
    script: "script",
    filed: "arquivada",
    requires: "requer",
    attachment: "anexo",
    problem: "problema",
    cancellation: "cancelamento",
    reason: "motivo",
    refusal: "recusa",
    closed: "fechada",
    model: "modelo",
    completion: "conclusão",
    division: "divisão",
    requesterpersonname: "solicitante",
    responsiblepersonname: "responsável",
  };

  const pt = tokens
    .map((token) => dictionaryPt[token.toLowerCase()] ?? token.toLowerCase())
    .join(" ")
    .replace(/^./, (char) => char.toUpperCase());

  const en = tokens.join(" ").replace(/^./, (char) => char.toUpperCase());

  return { pt, en };
}

function autoFieldMeta(alias: string, source: string): FieldMeta {
  const label = humanizeAlias(alias);
  return fieldMeta(
    label.pt,
    label.en,
    `Campo ${label.pt.toLowerCase()} disponível neste relatório.`,
    `${label.en} field available in this report.`,
    source,
  );
}

const reportFieldInventory: Record<string, Record<string, string>> = {
  "auditorias-planejadas": {
    AuditingPlanningCode: "AuditingPlanning.AuditingPlanning_Code",
    ContextCode: "AuditingPlanning.AuditingPlanning_ContextCode",
    CompanyCode: "Company.Company_Code",
    CompanyCorporateName: "Company.Company_CorporateName",
    AuditingPlanningPlannedDate: "AuditingPlanning.AuditingPlanning_PlannedDate",
    AuditingPlanningReplannedDate: "AuditingPlanning.AuditingPlanning_ReplannedDate",
    AuditingPlanningFrequency: "AuditingPlanning.AuditingPlanning_Frequency",
    AuditingPlanningUserModification: "AuditingPlanning.AuditingPlanning_UserModification",
    AuditingPlanningTupleCreatedIn: "AuditingPlanning.AuditingPlanning_TupleCreatedIn",
    AuditingPlanningTupleModifiedIn: "AuditingPlanning.AuditingPlanning_TupleModifiedIn",
    AuditingPlanningTupleExcluded: "AuditingPlanning.AuditingPlanning_TupleExcluded",
    AuditingPlanningGuid: "AuditingPlanning.AuditingPlanning_Guid",
    AuditingPlanningDepartmentCodeCode: "AuditingPlanning.AuditingPlanning_DepartmentCode",
    AuditingPlanningDepartmentCodeDescription: "Department.Department_Description",
    ResponsibleCode: "AuditingPlanning.AuditingPlanning_ResponsiblePersonCode",
    ResponsibleName: "Person.Person_Name",
    ResponsibleLastName: "Person.Person_LastName",
    ResponsibleDocumentType: "Person.Person_DocumentType",
    ResponsibleDocumentNumber: "Person.Person_DocumentNumber",
    AuditingPlanningTypeAuditCodeCode: "AuditingPlanning.AuditingPlanning_TypeAuditCode",
    AuditingPlanningTypeAuditCodeDescription: "TypeAudit.TypeAudit_Description",
    AuditingPlanningAuditLevelCodeCode: "AuditingPlanning.AuditingPlanning_AuditLevelCode",
    AuditingPlanningAuditLevelCodeDescription: "AuditLevel.AuditLevel_Description",
  },
  "auditorias-realizadas": {
    AuditCode: "Audit.Audit_Code",
    ContextCode: "Audit.Audit_ContextCode",
    CompanyCode: "Company.Company_Code",
    CompanyCorporateName: "Company.Company_CorporateName",
    TypeAuditCode: "Audit.TypeAudit_Code",
    TypeAuditDescription: "TypeAudit.TypeAudit_Description",
    AuditorCode: "Audit.Audit_AuditorPersonCode",
    AuditorName: "Person.Person_Name",
    AuditorLastName: "Person.Person_LastName",
    AuditorDocumentType: "Person.Person_DocumentType",
    AuditorDocumentNumber: "Person.Person_DocumentNumber",
    ResponsibleCode: "Audit.Audit_ResponsiblePersonCode",
    ResponsibleName: "Person.Person_Name",
    ResponsibleLastName: "Person.Person_LastName",
    ResponsibleDocumentType: "Person.Person_DocumentType",
    ResponsibleDocumentNumber: "Person.Person_DocumentNumber",
    AuditPlannedDate: "Audit.Audit_PlannedDate",
    AuditStartDate: "Audit.Audit_StartDate",
    AuditEndDate: "Audit.Audit_EndDate",
    AuditStatus: "Audit.Audit_Status",
    AuditUserModification: "Audit.Audit_UserModification",
    AuditTupleCreatedIn: "Audit.Audit_TupleCreatedIn",
    AuditTupleModifiedIn: "Audit.Audit_TupleModifiedIn",
    AuditTupleExcluded: "Audit.Audit_TupleExcluded",
    AuditGuid: "Audit.Audit_Guid",
    AuditDepartmentCodeCode: "Audit.Audit_DepartmentCode",
    AuditDepartmentCodeDescription: "Department.Department_Description",
    AuditSectorCodeCode: "Audit.Audit_SectorCode",
    AuditSectorCodeDescription: "Sector.Sector_Description",
    AuditIndustrialMachineCodeCode: "Audit.Audit_IndustrialMachineCode",
    AuditIndustrialMachineCodeDescription: "IndustrialMachine.IndustrialMachine_Description",
    AuditAuditingPlanningCodeCode: "Audit.Audit_AuditingPlanningCode",
    AuditAuditingPlanningCodeDescription: "AuditingPlanning.AuditingPlanning_Code",
    AuditLevelCode: "Audit.AuditLevel_Code",
    AuditLevelDescription: "AuditLevel.AuditLevel_Description",
    AuditTotalAnswers: "Audit.Audit_TotalAnswers",
    AuditTotalAnswerAvaliation: "Audit.Audit_TotalAnswerAvaliation",
    AuditTotalFormCompleted: "Audit.Audit_TotalFormCompleted",
    AuditTotalAuditAnsweScore: "Audit.Audit_TotalAuditAnsweScore",
    AuditScore: "Audit.Audit_Score",
  },
  "atividades-de-auditoria": {
    activityCode: "Activity.Activity_Code",
    activityContextCode: "Activity.Activity_ContextCode",
    activityParentCode: "Activity.Activity_ParentCode",
    activityDetail: "Activity.Activity_Detail",
    activityUserModification: "Activity.Activity_UserModification",
    activityTupleCreatedIn: "Activity.Activity_TupleCreatedIn",
    activityTupleModifiedIn: "Activity.Activity_TupleModifiedIn",
    activityTupleExcluded: "Activity.Activity_TupleExcluded",
    activityGuid: "Activity.Activity_Guid",
    activityDescriptionForRelease: "Activity.Activity_DescriptionForRelease",
    activityDetailForRelease: "Activity.Activity_DetailForRelease",
    activityPriority: "Activity.Activity_Priority",
    activityComplexity: "Activity.Activity_Complexity",
    activityOutsourced: "Activity.Activity_Outsourced",
    activityEstimatedTimeExecution: "Activity.Activity_EstimatedTimeExecution",
    activityEstimatedTimeReview: "Activity.Activity_EstimatedTimeReview",
    activityEstimatedTimeTesting: "Activity.Activity_EstimatedTimeTesting",
    activityDeadline: "Activity.Activity_Deadline",
    activityProjectCode: "Activity.Activity_ProjectCode",
    activityEpicCode: "Activity.Activity_EpicCode",
    activityIssueCode: "Activity.Activity_IssueCode",
    activityStartTime: "Activity.Activity_StartTime",
    activityEndTime: "Activity.Activity_EndTime",
    activityIsOnline: "Activity.Activity_IsOnline",
    activityLink: "Activity.Activity_Link",
    activityScript: "Activity.Activity_Script",
    scheduleCode: "Activity.Schedule_Code",
    activityLevel: "Activity.Activity_Level",
    activityPlannedDate: "Activity.Activity_PlannedDate",
    activityReplannedDate: "Activity.Activity_ReplannedDate",
    activityFiled: "Activity.Activity_Filed",
    activityRequiresAttachment: "Activity.Activity_RequiresAttachment",
    activityTitle: "Activity.Activity_Title",
    activityProblem: "Activity.Activity_Problem",
    activityImplementedDate: "Activity.Activity_ImplementedDate",
    activityCorrectiveAction: "Activity.Activity_CorrectiveAction",
    activityCancellationDate: "Activity.Activity_CancellationDate",
    activityReasonCancellation: "Activity.Activity_ReasonCancellation",
    activityFocusFactoryCode: "Activity.Activity_FocusFactoryCode",
    activityReasonRefusal: "Activity.Activity_ReasonRefusal",
    activityReasonDate: "Activity.Activity_ReasonDate",
    activityClosed: "Activity.Activity_ActivityClosed",
    activityActionPlanCode: "Activity.Activity_ActionPlanCode",
    activityIsModel: "Activity.Activity_IsModel",
    activityCompletionLevel: "Activity.Activity_CompletionLevel",
    activitySectionCode: "Activity.ActivitySection_Code",
    activityOccurrenceCode: "Activity.Activity_OccurrenceCode",
    activityOccurrenceCausesCode: "Activity.Activity_OccurrenceCausesCode",
    activityPrivate: "Activity.Activity_Private",
    activityArchived: "Activity.Activity_ActivityArchived",
    activityFailed: "Activity.Activity_ActivityFailed",
    activityDateClosed: "Activity.Activity_ActivityDateClosed",
    activitySectorCode: "Activity.Activity_SectorCode",
    activityAuditAnswerCode: "Activity.Activity_AuditAnswerCode",
    activityCorporateDivisionCode: "Activity.Activity_CorporateDivisionCode",
    frequencyIndicatorCode: "Activity.FrequencyIndicator_Code",
    activityObjective: "Activity.Activity_Objective",
    activityFunctionalRequirements: "Activity.Activity_FunctionalRequirements",
    activityBusinessRule: "Activity.Activity_BusinessRule",
    activityAcceptanceCriteria: "Activity.Activity_AcceptanceCriteria",
    activityOrder: "Activity.Activity_Order",
    activityOrderTo: "Activity.Activity_OrderTo",
    activityLastDateOrderUpdate: "Activity.Activity_LastDateOrderUpdate",
    activityAttendanceAnswerCode: "Activity.Activity_AttendanceAnswerCode",
    attendanceCode: "Activity.Attendance_Code",
    typeActivityCode: "Activity.TypeActivity_Code",
    activityOccurrenceAnswerCode: "Activity.Activity_OccurrenceAnswerCode",
    releaseCode: "Activity.Release_Code",
    activityUrl: "Activity.Activity_Guid",
    auditAnswerCode: "AuditAnswer.AuditAnswer_Code",
    auditAnswerAuditCode: "AuditAnswer.Audit_Code",
    auditAnswerSmartFormSectionFieldsCode: "AuditAnswer.AuditAnswer_SmartFormSectionFieldsCode",
    auditAnswerSmartFormSectionsFieldsOptionsCode: "AuditAnswer.AuditAnswer_SmartFormSectionsFieldsOptionsCode",
    auditAnswerAnswer: "AuditAnswer.AuditAnswer_Answer",
    auditAnswerAttachmentIdentifier: "AuditAnswer.AuditAnswer_AttachmentIdentifier",
    auditAnswerUserModification: "AuditAnswer.AuditAnswer_UserModification",
    auditAnswerTupleCreatedIn: "AuditAnswer.AuditAnswer_TupleCreatedIn",
    auditAnswerTupleModifiedIn: "AuditAnswer.AuditAnswer_TupleModifiedIn",
    auditAnswerTupleExcluded: "AuditAnswer.AuditAnswer_TupleExcluded",
    auditAnswerGuid: "AuditAnswer.AuditAnswer_Guid",
    auditAnswerAvaliationStatus: "AuditAnswer.AuditAnswer_AvaliationStatus",
    auditAnswerScore: "AuditAnswer.AuditAnswer_Score",
    auditCode: "Audit.Audit_Code",
    auditContextCode: "Audit.Audit_ContextCode",
    typeAuditCode: "Audit.TypeAudit_Code",
    auditAuditorPersonCode: "Audit.Audit_AuditorPersonCode",
    auditResponsiblePersonCode: "Audit.Audit_ResponsiblePersonCode",
    auditPlannedDate: "Audit.Audit_PlannedDate",
    auditStartDate: "Audit.Audit_StartDate",
    auditEndDate: "Audit.Audit_EndDate",
    auditStatus: "Audit.Audit_Status",
    auditUserModification: "Audit.Audit_UserModification",
    auditTupleCreatedIn: "Audit.Audit_TupleCreatedIn",
    auditTupleModifiedIn: "Audit.Audit_TupleModifiedIn",
    auditTupleExcluded: "Audit.Audit_TupleExcluded",
    auditGuid: "Audit.Audit_Guid",
    auditDepartmentCode: "Audit.Audit_DepartmentCode",
    auditSectorCode: "Audit.Audit_SectorCode",
    auditIndustrialMachineCode: "Audit.Audit_IndustrialMachineCode",
    auditAuditingPlanningCode: "Audit.Audit_AuditingPlanningCode",
    auditLevelCode: "Audit.AuditLevel_Code",
    auditTotalAnswers: "Audit.Audit_TotalAnswers",
    auditTotalAnswerAvaliation: "Audit.Audit_TotalAnswerAvaliation",
    auditTotalFormCompleted: "Audit.Audit_TotalFormCompleted",
    auditTotalAuditAnswerScore: "Audit.Audit_TotalAuditAnsweScore",
    auditScore: "Audit.Audit_Score",
    activityCompanyCorporateName: "Company.Company_CorporateName",
    activityProjectName: "Project.Project_Name",
    activityEpicDescription: "Epic.Epic_Description",
    activityIssueDescription: "Issue.Issue_Description",
    activityReleaseDescription: "Release.Release_Description",
    activityScheduleDescription: "Schedule.Schedule_Description",
    activitySectionDescription: "ActivitySection.ActivitySection_Description",
    activityOccurrenceDescription: "Occurrence.Occurrence_Description",
    activityOccurrenceCausesDetail: "OccurrenceCauses.OccurrenceCauses_Detail",
    activitySectorDescription: "Sector.Sector_Description",
    activityCorporateDivisionDescription: "CorporateDivision.CorporateDivision_Description",
    frequencyIndicatorDescription: "FrequencyIndicator.FrequencyIndicator_Description",
    typeActivityDescription: "TypeActivity.TypeActivity_Description",
    focusFactoryDescription: "FocusFactory.FocusFactory_Description",
    actionPlanDescription: "ActionPlan.ActionPlan_Description",
    auditCompanyCorporateName: "Company.Company_CorporateName",
    auditTypeAuditDescription: "TypeAudit.TypeAudit_Description",
    auditAuditorPersonName: "Person.Person_Name",
    auditResponsiblePersonName: "Person.Person_Name",
    auditDepartmentDescription: "Department.Department_Description",
    auditSectorDescription: "Sector.Sector_Description",
    auditIndustrialMachineDescription: "IndustrialMachine.IndustrialMachine_Description",
    auditLevelDescription: "AuditLevel.AuditLevel_Description",
    auditAnswerOptionsMaxValue: "SmartFormSectionFields.SmartFormSectionFields_OptionsMaxValue",
    auditAnswerOptionDescription: "SmartFormSectionsFieldsOptions.SmartFormSectionsFieldsOptions_Description",
    auditAnswerSectionDescription: "SmartFormSections.SmartFormSections_Description",
    ActivityStagesCode: "ActivityWorkflowStages.ActivityWorkflowStages_WorkflowStagesCode",
    ActivityStagesDescription: "WorkflowStages.WorkflowStages_Description",
    ActivityRequesterPersonName: "Person.Person_Name",
    ActivityResponsiblePersonName: "Person.Person_Name",
  },
  "nao-conformidade": {
    activityCode: "Activity.Activity_Code",
    activityTitle: "Activity.Activity_Title",
    activityDetail: "Activity.Activity_Detail",
    activityTupleCreatedIn: "Activity.Activity_TupleCreatedIn",
    activityImplementedDate: "Activity.Activity_ImplementedDate",
    activitySectorDescription: "Sector.Sector_Description",
    activityCompanyCorporateName: "Company.Company_CorporateName",
    ActivityStagesDescription: "WorkflowStages.WorkflowStages_Description",
    activityUrl: "Activity.Activity_Guid",
    auditCode: "Audit.Audit_Code",
    auditCompanyCorporateName: "Company.Company_CorporateName",
    auditTypeAuditDescription: "TypeAudit.TypeAudit_Description",
    auditAuditorPerSOnName: "Person.Person_Name",
    auditResponsiblePersonName: "Person.Person_Name",
    auditDepartmentDescription: "Department.Department_Description",
    auditSECtorDescription: "Sector.Sector_Description",
    auditIndustrialMachineDescription: "IndustrialMachine.IndustrialMachine_Description",
    auditLevelDescriPTion: "AuditLevel.AuditLevel_Description",
    ActivityRequesterPersonName: "Person.Person_Name",
    ActivityResponsiblePersonName: "Person.Person_Name",
  },
  "atividades-completas": {
    ActivityCode: "Activity.Activity_Code",
    ContextCode: "Activity.Activity_ContextCode",
    CompanyCode: "Company.Company_Code",
    CompanyCorporateName: "Company.Company_CorporateName",
    ActivityParentCodeCode: "Activity.Activity_ParentCode",
    ActivityParentCodeDescription: "Activity.Activity_Code",
    ActivityDetail: "Activity.Activity_Detail",
    ActivityUserModification: "Activity.Activity_UserModification",
    ActivityTupleCreatedIn: "Activity.Activity_TupleCreatedIn",
    ActivityTupleModifiedIn: "Activity.Activity_TupleModifiedIn",
    ActivityTupleExcluded: "Activity.Activity_TupleExcluded",
    ActivityGuid: "Activity.Activity_Guid",
    ActivityDescriptionForRelease: "Activity.Activity_DescriptionForRelease",
    ActivityDetailForRelease: "Activity.Activity_DetailForRelease",
    ActivityPriority: "Activity.Activity_Priority",
    ActivityComplexity: "Activity.Activity_Complexity",
    ActivityOutsourced: "Activity.Activity_Outsourced",
    ActivityEstimatedTimeExecution: "Activity.Activity_EstimatedTimeExecution",
    ActivityEstimatedTimeReview: "Activity.Activity_EstimatedTimeReview",
    ActivityEstimatedTimeTesting: "Activity.Activity_EstimatedTimeTesting",
    ActivityDeadline: "Activity.Activity_Deadline",
    ActivityProjectCodeCode: "Activity.Activity_ProjectCode",
    ActivityProjectCodeDescription: "Project.Project_Name",
    ActivityEpicCodeCode: "Activity.Activity_EpicCode",
    ActivityEpicCodeDescription: "Epic.Epic_Description",
    ActivityIssueCodeCode: "Activity.Activity_IssueCode",
    ActivityIssueCodeDescription: "Issue.Issue_Description",
    ActivityStartTime: "Activity.Activity_StartTime",
    ActivityEndTime: "Activity.Activity_EndTime",
    ActivityIsOnline: "Activity.Activity_IsOnline",
    ActivityLink: "Activity.Activity_Link",
    ActivityScript: "Activity.Activity_Script",
    ScheduleCode: "Activity.Schedule_Code",
    ScheduleDescription: "Schedule.Schedule_Description",
    ActivityLevel: "Activity.Activity_Level",
    ActivityPlannedDate: "Activity.Activity_PlannedDate",
    ActivityReplannedDate: "Activity.Activity_ReplannedDate",
    ActivityFiled: "Activity.Activity_Filed",
    ActivityRequiresAttachment: "Activity.Activity_RequiresAttachment",
    ActivityTitle: "Activity.Activity_Title",
    ActivityProblem: "Activity.Activity_Problem",
    ActivityImplementedDate: "Activity.Activity_ImplementedDate",
    ActivityCorrectiveAction: "Activity.Activity_CorrectiveAction",
    ActivityCancellationDate: "Activity.Activity_CancellationDate",
    ActivityReasonCancellation: "Activity.Activity_ReasonCancellation",
    ActivityFocusFactoryCodeCode: "Activity.Activity_FocusFactoryCode",
    ActivityFocusFactoryCodeDescription: "FocusFactory.FocusFactory_Description",
    ActivityReasonRefusal: "Activity.Activity_ReasonRefusal",
    ActivityReasonDate: "Activity.Activity_ReasonDate",
    ActivityActivityClosed: "Activity.Activity_ActivityClosed",
    ActivityActionPlanCodeCode: "Activity.Activity_ActionPlanCode",
    ActivityActionPlanCodeDescription: "ActionPlan.ActionPlan_Description",
    ActivityIsModel: "Activity.Activity_IsModel",
    ActivityCompletionLevel: "Activity.Activity_CompletionLevel",
    ActivitySectionCode: "Activity.ActivitySection_Code",
    ActivitySectionDescription: "ActivitySection.ActivitySection_Description",
    ActivityOccurrenceCodeCode: "Activity.Activity_OccurrenceCode",
    ActivityOccurrenceCodeDescription: "Occurrence.Occurrence_Description",
    ActivityOccurrenceCausesCodeCode: "Activity.Activity_OccurrenceCausesCode",
    ActivityOccurrenceCausesCodeDescription: "OccurrenceCauses.OccurrenceCauses_Code",
    ActivityPrivate: "Activity.Activity_Private",
    ActivityActivityArchived: "Activity.Activity_ActivityArchived",
    ActivityActivityFailed: "Activity.Activity_ActivityFailed",
    ActivityActivityDateClosed: "Activity.Activity_ActivityDateClosed",
    ActivitySectorCodeCode: "Activity.Activity_SectorCode",
    ActivitySectorCodeDescription: "Sector.Sector_Description",
    ActivityAuditAnswerCode: "Activity.Activity_AuditAnswerCode",
    ActivityCorporateDivisionCodeCode: "Activity.Activity_CorporateDivisionCode",
    ActivityCorporateDivisionCodeDescription: "CorporateDivision.CorporateDivision_Description",
    FrequencyIndicatorCode: "Activity.FrequencyIndicator_Code",
    FrequencyIndicatorDescription: "FrequencyIndicator.FrequencyIndicator_Description",
    ActivityObjective: "Activity.Activity_Objective",
    ActivityFunctionalRequirements: "Activity.Activity_FunctionalRequirements",
    ActivityBusinessRule: "Activity.Activity_BusinessRule",
    ActivityAcceptanceCriteria: "Activity.Activity_AcceptanceCriteria",
    ActivityOrder: "Activity.Activity_Order",
    ActivityOrderTo: "Activity.Activity_OrderTo",
    ActivityLastDateOrderUpdate: "Activity.Activity_LastDateOrderUpdate",
    ActivityAttendanceAnswerCode: "Activity.Activity_AttendanceAnswerCode",
    AttendanceCode: "Activity.Attendance_Code",
    AttendanceDescription: "Attendance.Attendance_Code",
    TypeActivityCode: "Activity.TypeActivity_Code",
    TypeActivityDescription: "TypeActivity.TypeActivity_Description",
    ActivityOccurrenceAnswerCode: "Activity.Activity_OccurrenceAnswerCode",
    ReleaseCode: "Activity.Release_Code",
    ReleaseDescription: "Release.Release_Description",
    ActivityDegreeRefusal: "Activity.Activity_DegreeRefusal",
    ActivityStack: "Activity.Activity_Stack",
    MainWorkflowStagesCode: "ActivityWorkflowStages.ActivityWorkflowStages_WorkflowStagesCode",
    MainWorkflowStagesDescription: "WorkflowStages.WorkflowStages_Description",
    ActivityDevelopmentForecast: "Activity.Activity_DevelopmentForecast",
    Status_occurrence: "OccurrenceStatus.OccurrenceStatus_Description",
    RequesterPersonName: "Person.Person_Name",
    ResponsiblePersonName: "Person.Person_Name",
    link: "Activity.Activity_Guid",
    indicator_Activ_code: "Activity.Activity_Code",
    Indicator: "Indicator.Indicator_Description",
  },
};

function getReportFieldMetaMap(reportId: string): Record<string, FieldMeta> {
  const semantic = reportSemantics[reportId];
  if (!semantic) {
    return {};
  }

  const generated = Object.fromEntries(
    Object.entries(reportFieldInventory[reportId] ?? {}).map(([alias, source]) => [alias, autoFieldMeta(alias, source)]),
  );

  return {
    ...generated,
    ...semantic.fieldMeta,
  };
}

const commonFieldMeta: Record<string, FieldMeta> = {
  CompanyCorporateName: fieldMeta(
    "Empresa",
    "Company",
    "Nome corporativo da empresa associado ao registro.",
    "Corporate company name associated with the record.",
    "Company.Company_CorporateName",
  ),
  Company: fieldMeta(
    "Empresa",
    "Company",
    "Empresa associada ao registro.",
    "Company associated with the record.",
    "Company",
  ),
  Issue: fieldMeta(
    "Issue",
    "Issue",
    "Identificador do item, ocorrência ou issue relacionado ao registro.",
    "Identifier of the item, occurrence, or issue related to the record.",
    "Issue / Occurrence",
  ),
  ResponsibleName: fieldMeta(
    "Responsável",
    "Responsible owner",
    "Pessoa responsável pelo item no processo.",
    "Person responsible for the item in the process.",
    "Person.Person_Name",
  ),
  Champion: fieldMeta(
    "Champion",
    "Champion",
    "Responsável principal pelo avanço da ocorrência.",
    "Primary owner driving the occurrence forward.",
    "Person.Person_Name",
  ),
  Status_Occurrence: fieldMeta(
    "Status executivo",
    "Executive status",
    "Leitura consolidada do status para acompanhamento gerencial.",
    "Consolidated status for management follow-up.",
    "Derived SQL alias",
  ),
  "Focus Factory": fieldMeta(
    "Focus Factory",
    "Focus Factory",
    "Área fabril ou foco organizacional associado ao registro.",
    "Plant focus area associated with the record.",
    "FocusFactory",
  ),
  "Issue Date": fieldMeta(
    "Data da ocorrência",
    "Issue date",
    "Data em que a ocorrência foi registrada.",
    "Date when the occurrence was recorded.",
    "Occurrence",
  ),
  Indicator: fieldMeta(
    "Indicador",
    "Indicator",
    "Indicador associado ao evento ou ocorrência.",
    "Indicator associated with the event or occurrence.",
    "Indicator",
  ),
  "Type Occurrence": fieldMeta(
    "Tipo de ocorrência",
    "Occurrence type",
    "Classificação principal da ocorrência.",
    "Main occurrence classification.",
    "TypeOccurrence",
  ),
  Sector_Description: fieldMeta(
    "Setor",
    "Sector",
    "Setor associado ao registro.",
    "Sector associated with the record.",
    "Sector",
  ),
  "Part #": fieldMeta(
    "Nº da peça",
    "Part #",
    "Código ou SKU da peça associada ao registro.",
    "Part code or SKU associated with the record.",
    "Product.Product_SKU",
  ),
  "Customer Plant": fieldMeta(
    "Planta do cliente",
    "Customer plant",
    "Unidade ou planta do cliente relacionada ao registro.",
    "Customer unit or plant related to the record.",
    "CustomerRelationship.CustomerRelationship_Description",
  ),
  "Customer Class": fieldMeta(
    "Classe do cliente",
    "Customer class",
    "Classificação do cliente associada ao registro.",
    "Customer classification associated with the record.",
    "CustomerClass.CustomerClass_Description",
  ),
  "Product Family": fieldMeta(
    "Família do produto",
    "Product family",
    "Família do produto associada ao item.",
    "Product family associated with the item.",
    "ProductFamily.ProductFamily_Description",
  ),
  Project: fieldMeta(
    "Projeto",
    "Project",
    "Projeto relacionado ao registro.",
    "Project related to the record.",
    "Project.Project_Name",
  ),
  Defect: fieldMeta(
    "Defeito",
    "Defect",
    "Descrição do defeito ou desvio registrado.",
    "Description of the recorded defect or deviation.",
    "Occurrence.Occurrence_Description",
  ),
  Side: fieldMeta(
    "Lado",
    "Side",
    "Lado do produto ou componente afetado.",
    "Affected side of the product or component.",
    "Derived SQL alias",
  ),
  "Who Detected?": fieldMeta(
    "Quem detectou?",
    "Who detected?",
    "Perfil ou origem de quem detectou o problema.",
    "Profile or origin of who detected the problem.",
    "WhoDetected.WhoDetected_Description",
  ),
  "Where detected?": fieldMeta(
    "Onde foi detectado?",
    "Where detected?",
    "Etapa, local ou contexto em que o problema foi detectado.",
    "Stage, location, or context where the problem was detected.",
    "WhereDetected.WhereDetected_Description",
  ),
  "Production Date": fieldMeta(
    "Data de produção",
    "Production date",
    "Data de produção da peça ou lote relacionado.",
    "Production date of the related part or batch.",
    "Occurrence.Occurrence_ProductionDate",
  ),
  Shift: fieldMeta(
    "Turno",
    "Shift",
    "Turno de produção associado ao registro.",
    "Production shift associated with the record.",
    "Shift.Shift_Description",
  ),
  "Repeats?": fieldMeta(
    "Reincide?",
    "Repeats?",
    "Indica se a ocorrência já se repetiu anteriormente.",
    "Indicates whether the occurrence has happened before.",
    "Derived SQL alias",
  ),
  "Safe Launch?": fieldMeta(
    "Lançamento seguro?",
    "Safe launch?",
    "Indica se o item está relacionado a contexto de safe launch.",
    "Indicates whether the item is related to a safe launch context.",
    "Derived SQL alias",
  ),
  "Customer Doc.": fieldMeta(
    "Documento do cliente",
    "Customer document",
    "Documento informado pelo cliente para a ocorrência.",
    "Customer-provided document for the occurrence.",
    "Occurrence.Occurrence_DocumentCustomer",
  ),
  "Cost Customer document": fieldMeta(
    "Custo do documento do cliente",
    "Customer document cost",
    "Custo consolidado associado ao documento do cliente.",
    "Consolidated cost associated with the customer document.",
    "Derived SQL alias",
  ),
  "PPSR #": fieldMeta(
    "Nº PPSR",
    "PPSR #",
    "Identificador PPSR relacionado à ocorrência.",
    "PPSR identifier related to the occurrence.",
    "Occurrence.Occurrence_Code",
  ),
  "Costs origin from failure": fieldMeta(
    "Custos originados pela falha",
    "Costs from failure",
    "Custos atribuídos à falha registrada.",
    "Costs attributed to the recorded failure.",
    "Derived SQL alias",
  ),
  "Incidents Type": fieldMeta(
    "Tipo de incidente",
    "Incident type",
    "Classificação do tipo de incidente relacionado.",
    "Classification of the related incident type.",
    "TypeIncident.TypeIncident_Description",
  ),
  Class: fieldMeta(
    "Classe",
    "Class",
    "Classe ou agrupamento principal do registro.",
    "Primary class or grouping of the record.",
    "OccurrenceClass.OccurrenceClass_Description",
  ),
  "Launch or Serie?": fieldMeta(
    "Lançamento ou série?",
    "Launch or series?",
    "Indica se o item pertence a lançamento ou produção em série.",
    "Indicates whether the item belongs to launch or series production.",
    "LaunchSeries.LaunchSeries_Description",
  ),
  Status: fieldMeta(
    "Status",
    "Status",
    "Status operacional original do registro.",
    "Original operational status of the record.",
    "OccurrenceSituation.OccurrenceSituation_Description",
  ),
  "Major Event?": fieldMeta(
    "Evento maior?",
    "Major event?",
    "Indica se a ocorrência foi classificada como evento maior.",
    "Indicates whether the occurrence was classified as a major event.",
    "MajorEvent.MajorEvent_Description",
  ),
  "Who caused the defect?": fieldMeta(
    "Quem causou o defeito?",
    "Who caused the defect?",
    "Origem atribuída ao defeito ou desvio.",
    "Attributed origin of the defect or deviation.",
    "WhoCausedDefect.WhoCausedDefect_Description",
  ),
  "Machine / Station resp.": fieldMeta(
    "Máquina / estação responsável",
    "Responsible machine / station",
    "Máquina ou estação associada à responsabilidade pelo evento.",
    "Machine or station associated with responsibility for the event.",
    "IndustrialMachine.IndustrialMachine_Description",
  ),
  Injection: fieldMeta(
    "Injeção",
    "Injection",
    "Campo reservado para contexto de injeção quando disponível.",
    "Reserved field for injection context when available.",
    "Derived SQL alias",
  ),
  Risk: fieldMeta(
    "Risco",
    "Risk",
    "Nível ou categoria de risco associado ao registro.",
    "Risk level or category associated with the record.",
    "Risk.Risk_Description",
  ),
  Effort: fieldMeta(
    "Esforço",
    "Effort",
    "Esforço estimado ou categoria de esforço associada ao caso.",
    "Estimated effort or effort category associated with the case.",
    "Effort.Effort_Description",
  ),
  Priority: fieldMeta(
    "Prioridade",
    "Priority",
    "Prioridade operacional do registro.",
    "Operational priority of the record.",
    "Occurrence.Occurrence_Priority",
  ),
  Escalation: fieldMeta(
    "Escalonamento",
    "Escalation",
    "Nível ou categoria de escalonamento do caso.",
    "Escalation level or category for the case.",
    "Escalation.Escalation_Description",
  ),
  "ICA Date Planned": fieldMeta(
    "Data planejada da ICA",
    "ICA planned date",
    "Data planejada para a ação corretiva imediata.",
    "Planned date for the immediate corrective action.",
    "ICA.Activity_PlannedDate_ICA",
  ),
  "ICA Date Implemented": fieldMeta(
    "Data implementada da ICA",
    "ICA implemented date",
    "Data em que a ação corretiva imediata foi implementada.",
    "Date when the immediate corrective action was implemented.",
    "ICA.mAX_ImplementedDate_ICA",
  ),
  "Root Cause(s)": fieldMeta(
    "Causa(s) raiz",
    "Root cause(s)",
    "Causas-raiz registradas para a ocorrência.",
    "Root causes recorded for the occurrence.",
    "OccurrenceCauses.OccurrenceCauses_Detail",
  ),
  "Permanent Corrective Action (PCA)": fieldMeta(
    "Ação corretiva permanente (PCA)",
    "Permanent corrective action (PCA)",
    "Descrição da ação corretiva permanente associada ao caso.",
    "Description of the permanent corrective action associated with the case.",
    "PCA.Activity_Title_pca",
  ),
  "PCA Date Planned": fieldMeta(
    "Data planejada da PCA",
    "PCA planned date",
    "Data planejada da ação corretiva permanente.",
    "Planned date of the permanent corrective action.",
    "PCA.Activity_PlannedDate_PCA",
  ),
  "PCA Date Implemented": fieldMeta(
    "Data implementada da PCA",
    "PCA implemented date",
    "Data em que a ação corretiva permanente foi implementada.",
    "Date when the permanent corrective action was implemented.",
    "PCA.mAX_ImplementedDate_PCA",
  ),
  "Root cause Linkage": fieldMeta(
    "Vínculo da causa raiz",
    "Root cause linkage",
    "Relacionamento entre a causa raiz e o caso analisado.",
    "Relationship between the root cause and the analyzed case.",
    "RootCauseLinkage.RootCauseLinkage_Description",
  ),
  "MQS Binning": fieldMeta(
    "Classificação MQS",
    "MQS binning",
    "Categoria MQS atribuída ao registro.",
    "MQS category assigned to the record.",
    "MQS.MQS_Description",
  ),
  Comments: fieldMeta(
    "Comentários",
    "Comments",
    "Campo livre para observações adicionais.",
    "Free-text field for additional observations.",
    "Derived SQL alias",
  ),
  CorporateName: fieldMeta(
    "Nome corporativo",
    "Corporate name",
    "Nome corporativo resumido da empresa.",
    "Short corporate name of the company.",
    "Company.Company_CorporateName",
  ),
  Link: fieldMeta(
    "Link",
    "Link",
    "Link direto para o registro original.",
    "Direct link to the original record.",
    "Derived SQL alias",
  ),
  Link_actv: fieldMeta(
    "Link de atividades",
    "Activities link",
    "Link direto para as atividades relacionadas ao registro.",
    "Direct link to activities related to the record.",
    "Derived SQL alias",
  ),
  Activity_open: fieldMeta(
    "Atividades abertas",
    "Open activities",
    "Quantidade de atividades abertas vinculadas ao registro.",
    "Number of open activities linked to the record.",
    "Derived SQL alias",
  ),
  Activity_delay: fieldMeta(
    "Atividades em atraso",
    "Delayed activities",
    "Quantidade de atividades em atraso vinculadas ao registro.",
    "Number of delayed activities linked to the record.",
    "Derived SQL alias",
  ),
  Disposition: fieldMeta(
    "Disposição",
    "Disposition",
    "Encaminhamento ou disposição definida para o caso.",
    "Disposition defined for the case.",
    "Disposition.Disposition_Description",
  ),
  Result: fieldMeta(
    "Resultado",
    "Result",
    "Resultado final ou parcial associado ao registro.",
    "Final or partial result associated with the record.",
    "Occurrence.Occurrence_Result",
  ),
  Qty_Founded: fieldMeta(
    "Quantidade encontrada",
    "Quantity found",
    "Quantidade encontrada ou reportada no evento.",
    "Quantity found or reported in the event.",
    "Occurrence.Occurrence_Amount",
  ),
  ActivityCode: fieldMeta(
    "Código da atividade",
    "Activity code",
    "Identificador da atividade.",
    "Activity identifier.",
    "Activity.Activity_Code",
  ),
  ContextCode: fieldMeta(
    "Código do contexto",
    "Context code",
    "Identificador do contexto relacionado à atividade.",
    "Identifier of the context related to the activity.",
    "Activity.Activity_ContextCode",
  ),
  CompanyCode: fieldMeta(
    "Código da empresa",
    "Company code",
    "Código da empresa associada ao registro.",
    "Code of the company associated with the record.",
    "Company.Company_Code",
  ),
  ActivityParentCodeCode: fieldMeta(
    "Código da atividade pai",
    "Parent activity code",
    "Código da atividade pai, quando a atividade possui hierarquia.",
    "Code of the parent activity when the activity is hierarchical.",
    "Activity.Activity_ParentCode",
  ),
  ActivityParentCodeDescription: fieldMeta(
    "Atividade pai",
    "Parent activity",
    "Identificação da atividade pai vinculada.",
    "Identification of the linked parent activity.",
    "Activity.Activity_Code",
  ),
  ActivityDetail: fieldMeta(
    "Detalhe da atividade",
    "Activity detail",
    "Descrição detalhada da atividade com HTML removido.",
    "Detailed activity description with HTML stripped.",
    "Activity.Activity_Detail",
  ),
  ActivityTupleCreatedIn: fieldMeta(
    "Criada em",
    "Created on",
    "Data de criação do registro da atividade.",
    "Creation date of the activity record.",
    "Activity.Activity_TupleCreatedIn",
  ),
  ActivityTupleModifiedIn: fieldMeta(
    "Atualizada em",
    "Modified on",
    "Data da última atualização da atividade.",
    "Date of the last activity update.",
    "Activity.Activity_TupleModifiedIn",
  ),
  ActivityTupleExcluded: fieldMeta(
    "Excluída",
    "Excluded",
    "Indica exclusão lógica da atividade.",
    "Indicates logical exclusion of the activity.",
    "Activity.Activity_TupleExcluded",
  ),
  ActivityDescriptionForRelease: fieldMeta(
    "Descrição para release",
    "Release description",
    "Descrição da atividade preparada para release.",
    "Activity description prepared for release.",
    "Activity.Activity_DescriptionForRelease",
  ),
  ActivityImplementedDate: fieldMeta(
    "Data de implementação",
    "Implementation date",
    "Data em que a atividade foi implementada.",
    "Date when the activity was implemented.",
    "Activity.Activity_ImplementedDate",
  ),
  ActivityCorrectiveAction: fieldMeta(
    "Ação corretiva",
    "Corrective action",
    "Texto da ação corretiva vinculada à atividade.",
    "Text of the corrective action linked to the activity.",
    "Activity.Activity_CorrectiveAction",
  ),
  ActivityFocusFactoryCodeDescription: fieldMeta(
    "Fábrica foco",
    "Focus factory",
    "Descrição da fábrica foco associada à atividade.",
    "Description of the focus factory associated with the activity.",
    "FocusFactory.FocusFactory_Description",
  ),
  MainWorkflowStagesDescription: fieldMeta(
    "Etapa principal do workflow",
    "Main workflow stage",
    "Etapa principal do workflow em que a atividade se encontra.",
    "Main workflow stage where the activity currently sits.",
    "WorkflowStages.WorkflowStages_Description",
  ),
  RequesterPersonName: fieldMeta(
    "Solicitante",
    "Requester",
    "Pessoa que solicitou a atividade.",
    "Person who requested the activity.",
    "Person.Person_Name",
  ),
  ResponsiblePersonName: fieldMeta(
    "Responsável",
    "Responsible owner",
    "Pessoa responsável pela atividade.",
    "Person responsible for the activity.",
    "Person.Person_Name",
  ),
};

function buildGenericKpis(options: {
  statusField?: string;
  ownerField?: string;
  dateField?: string;
  focusField?: string;
  reportTitle: LocalizedText;
}): SemanticKpi[] {
  const kpis: SemanticKpi[] = [
    {
      id: "total-records",
      label: { "pt-BR": "Total de registros", "en-US": "Total records" },
      description: {
        "pt-BR": "Quantidade total de linhas retornadas pelo relatório atual.",
        "en-US": "Total number of rows returned by the current report.",
      },
      source: "Derived from result set",
      compute: (rows, locale) => formatNumber(rows.length, locale),
    },
  ];

  if (options.statusField) {
    kpis.push({
      id: "open-items",
      label: { "pt-BR": "Itens abertos", "en-US": "Open items" },
      description: {
        "pt-BR": "Quantidade de registros com status aberto, pendente ou em andamento.",
        "en-US": "Number of records with open, pending, or in-progress status.",
      },
      source: options.statusField,
      compute: (rows, locale) => formatNumber(countOpenLike(rows, options.statusField ?? ""), locale),
    });
  }

  if (options.ownerField) {
    kpis.push({
      id: "owners",
      label: { "pt-BR": "Responsáveis únicos", "en-US": "Unique owners" },
      description: {
        "pt-BR": "Quantidade de responsáveis distintos no recorte atual.",
        "en-US": "Number of distinct owners in the current slice.",
      },
      source: options.ownerField,
      compute: (rows, locale) => formatNumber(uniqueCount(rows, options.ownerField ?? ""), locale),
    });
  }

  if (options.focusField) {
    kpis.push({
      id: "top-focus",
      label: { "pt-BR": "Maior concentração", "en-US": "Largest concentration" },
      description: {
        "pt-BR": "Categoria com maior volume dentro do campo-chave do relatório.",
        "en-US": "Category with the largest volume within the report's key field.",
      },
      source: options.focusField,
      compute: (rows) => topCategory(rows, options.focusField ?? ""),
    });
  }

  if (options.dateField) {
    kpis.push({
      id: "dated-records",
      label: { "pt-BR": "Registros com data", "en-US": "Dated records" },
      description: {
        "pt-BR": "Quantidade de registros com a data-chave preenchida.",
        "en-US": "Number of records with the key date field populated.",
      },
      source: options.dateField,
      compute: (rows, locale) =>
        formatNumber(countWhere(rows, (row) => normalizeString(row[options.dateField ?? ""]) !== ""), locale),
    });
  }

  return kpis;
}

function buildGenericCharts(options: {
  statusField?: string;
  ownerField?: string;
  dateField?: string;
  focusField?: string;
}): SemanticChart[] {
  const charts: SemanticChart[] = [];

  if (options.statusField) {
    charts.push({
      id: "status-share",
      chartType: "pie",
      title: { "pt-BR": "Distribuição por status", "en-US": "Distribution by status" },
      description: {
        "pt-BR": "Mostra o peso relativo de cada status no recorte atual.",
        "en-US": "Shows the relative weight of each status in the current slice.",
      },
      categoryField: options.statusField,
    });
  } else if (options.focusField) {
    charts.push({
      id: "focus-share",
      chartType: "pie",
      title: { "pt-BR": "Distribuição principal", "en-US": "Main distribution" },
      description: {
        "pt-BR": "Mostra a participação de cada grupo principal no recorte atual.",
        "en-US": "Shows the share of each main group in the current slice.",
      },
      categoryField: options.focusField,
    });
  }

  if (options.ownerField) {
    charts.push({
      id: "owner-load",
      chartType: "bar",
      title: { "pt-BR": "Carga por responsável", "en-US": "Load by owner" },
      description: {
        "pt-BR": "Compara o volume de registros por responsável.",
        "en-US": "Compares record volume by owner.",
      },
      categoryField: options.ownerField,
    });
  }

  if (options.focusField && options.dateField) {
    charts.push({
      id: "trend-by-focus",
      chartType: "combo",
      title: { "pt-BR": "Tendência por foco", "en-US": "Trend by focus" },
      description: {
        "pt-BR": "Combina o agrupamento principal com a evolução temporal do relatório.",
        "en-US": "Combines the main grouping with the report's time evolution.",
      },
      categoryField: options.focusField,
      dateField: options.dateField,
    });
  } else if (options.focusField) {
    charts.push({
      id: "main-distribution",
      chartType: "bar",
      title: { "pt-BR": "Distribuição principal", "en-US": "Main distribution" },
      description: {
        "pt-BR": "Mostra a concentração dos registros no principal agrupador do relatório.",
        "en-US": "Shows record concentration in the report's main grouping.",
      },
      categoryField: options.focusField,
    });
  }

  return charts.slice(0, 3);
}

function buildGenericCorrelations(fields: Array<{ leftField: string; rightField: string; rationalePt: string; rationaleEn: string }>): SemanticCorrelation[] {
  return fields.map((fieldPair, index) => ({
    id: `correlation-${index + 1}`,
    leftField: fieldPair.leftField,
    rightField: fieldPair.rightField,
    rationale: {
      "pt-BR": fieldPair.rationalePt,
      "en-US": fieldPair.rationaleEn,
    },
  }));
}

function createDefinition(options: {
  title: LocalizedText;
  overview: LocalizedText;
  fieldMeta?: Record<string, FieldMeta>;
  concepts: ReportConceptEntry[];
  statusField?: string;
  ownerField?: string;
  dateField?: string;
  focusField?: string;
  correlations?: Array<{ leftField: string; rightField: string; rationalePt: string; rationaleEn: string }>;
}): ReportSemanticDefinition {
  return {
    title: options.title,
    overview: options.overview,
    fieldMeta: {
      ...commonFieldMeta,
      ...(options.fieldMeta ?? {}),
    },
    concepts: options.concepts,
    kpis: buildGenericKpis({
      statusField: options.statusField,
      ownerField: options.ownerField,
      dateField: options.dateField,
      focusField: options.focusField,
      reportTitle: options.title,
    }),
    charts: buildGenericCharts({
      statusField: options.statusField,
      ownerField: options.ownerField,
      dateField: options.dateField,
      focusField: options.focusField,
    }),
    correlations: buildGenericCorrelations(options.correlations ?? []),
  };
}

const reportSemantics: Record<string, ReportSemanticDefinition> = {
  "auditorias-planejadas": createDefinition({
    title: { "pt-BR": "Auditorias Planejadas", "en-US": "Planned Audits" },
    overview: {
      "pt-BR":
        "Mostra o pipeline de auditorias planejadas, destacando agenda futura, área responsável, setor e cobertura de execução.",
      "en-US":
        "Shows the planned audit pipeline, highlighting future schedule, responsible area, sector, and execution coverage.",
    },
    fieldMeta: {
      AuditingPlanningCode: fieldMeta(
        "Código do planejamento",
        "Planning code",
        "Identificador do planejamento de auditoria.",
        "Audit planning identifier.",
        "AuditingPlanning.AuditingPlanning_Code",
      ),
      AuditingPlanningPlannedDate: fieldMeta(
        "Data planejada",
        "Planned date",
        "Data originalmente prevista para a auditoria.",
        "Originally planned date for the audit.",
        "AuditingPlanning.AuditingPlanning_PlannedDate",
      ),
      AuditingPlanningReplannedDate: fieldMeta(
        "Data replanejada",
        "Rescheduled date",
        "Nova data após replanejamento.",
        "New date after rescheduling.",
        "AuditingPlanning.AuditingPlanning_ReplannedDate",
      ),
      AuditingPlanningFrequency: fieldMeta(
        "Frequência",
        "Frequency",
        "Frequência definida no planejamento.",
        "Frequency defined in the plan.",
        "AuditingPlanning.AuditingPlanning_Frequency",
      ),
      AuditingPlanningUserModification: fieldMeta("Usuário modificador", "Modifying user", "Usuário que alterou o planejamento.", "User who modified the planning record.", "AuditingPlanning.AuditingPlanning_UserModification"),
      AuditingPlanningTupleCreatedIn: fieldMeta("Criado em", "Created on", "Data de criação do planejamento.", "Planning creation date.", "AuditingPlanning.AuditingPlanning_TupleCreatedIn"),
      AuditingPlanningTupleModifiedIn: fieldMeta("Atualizado em", "Modified on", "Data da última atualização do planejamento.", "Latest planning update date.", "AuditingPlanning.AuditingPlanning_TupleModifiedIn"),
      AuditingPlanningTupleExcluded: fieldMeta("Excluído", "Excluded", "Indica exclusão lógica do planejamento.", "Indicates logical exclusion of the planning record.", "AuditingPlanning.AuditingPlanning_TupleExcluded"),
      AuditingPlanningGuid: fieldMeta("GUID do planejamento", "Planning GUID", "Identificador global do planejamento.", "Global identifier of the planning record.", "AuditingPlanning.AuditingPlanning_Guid"),
      AuditingPlanningDepartmentCodeCode: fieldMeta("Código do departamento", "Department code", "Código do departamento vinculado ao planejamento.", "Department code linked to the planning record.", "AuditingPlanning.AuditingPlanning_DepartmentCode"),
      AuditingPlanningTypeAuditCodeDescription: fieldMeta(
        "Tipo de auditoria",
        "Audit type",
        "Descrição do tipo de auditoria planejada.",
        "Description of the planned audit type.",
        "TypeAudit.TypeAudit_Description",
      ),
      AuditingPlanningTypeAuditCodeCode: fieldMeta("Código do tipo de auditoria", "Audit type code", "Código do tipo de auditoria planejada.", "Code of the planned audit type.", "AuditingPlanning.AuditingPlanning_TypeAuditCode"),
      AuditingPlanningAuditLevelCodeCode: fieldMeta("Código do nível", "Level code", "Código do nível de auditoria planejado.", "Code of the planned audit level.", "AuditingPlanning.AuditingPlanning_AuditLevelCode"),
      AuditingPlanningAuditLevelCodeDescription: fieldMeta("Nível da auditoria", "Audit level", "Descrição do nível da auditoria planejada.", "Description of the planned audit level.", "AuditLevel.AuditLevel_Description"),
      AuditingPlanningDepartmentCodeDescription: fieldMeta(
        "Departamento",
        "Department",
        "Departamento responsável pelo planejamento.",
        "Department responsible for the planning.",
        "Department.Department_Description",
      ),
      ResponsibleCode: fieldMeta("Código do responsável", "Responsible code", "Código da pessoa responsável pelo planejamento.", "Code of the person responsible for the planning.", "Person.Person_Code"),
      ResponsibleName: commonFieldMeta.ResponsibleName,
      ResponsibleLastName: fieldMeta("Sobrenome do responsável", "Responsible last name", "Sobrenome da pessoa responsável.", "Last name of the responsible person.", "Person.Person_LastName"),
      ResponsibleDocumentType: fieldMeta("Tipo de documento do responsável", "Responsible document type", "Tipo de documento da pessoa responsável.", "Document type of the responsible person.", "Person.Person_DocumentType"),
      ResponsibleDocumentNumber: fieldMeta("Número do documento do responsável", "Responsible document number", "Número do documento da pessoa responsável.", "Document number of the responsible person.", "Person.Person_DocumentNumber"),
      Sector_Description: commonFieldMeta.Sector_Description,
    },
    concepts: [
      { conceptKey: "company", field: "CompanyCorporateName", label: { "pt-BR": "Empresa", "en-US": "Company" } },
      { conceptKey: "auditType", field: "AuditingPlanningTypeAuditCodeDescription", label: { "pt-BR": "Tipo de auditoria", "en-US": "Audit type" } },
      { conceptKey: "department", field: "AuditingPlanningDepartmentCodeDescription", label: { "pt-BR": "Departamento", "en-US": "Department" } },
      { conceptKey: "owner", field: "ResponsibleName", label: { "pt-BR": "Responsável", "en-US": "Owner" } },
      { conceptKey: "sector", field: "Sector_Description", label: { "pt-BR": "Setor", "en-US": "Sector" } },
      { conceptKey: "date", field: "AuditingPlanningPlannedDate", label: { "pt-BR": "Data planejada", "en-US": "Planned date" } },
    ],
    ownerField: "ResponsibleName",
    dateField: "AuditingPlanningPlannedDate",
    focusField: "Sector_Description",
    correlations: [
      {
        leftField: "AuditingPlanningDepartmentCodeDescription",
        rightField: "Sector_Description",
        rationalePt: "Cruza departamento e setor para mostrar onde a agenda futura está concentrada.",
        rationaleEn: "Crosses department and sector to show where the future agenda is concentrated.",
      },
    ],
  }),
  "auditorias-realizadas": createDefinition({
    title: { "pt-BR": "Auditorias Realizadas", "en-US": "Completed Audits" },
    overview: {
      "pt-BR":
        "Consolida auditorias já executadas para análise de desempenho, resultado e distribuição por auditor e área.",
      "en-US":
        "Consolidates completed audits for performance, outcome, and distribution analysis by auditor and area.",
    },
    fieldMeta: {
      AuditCode: fieldMeta("Código da auditoria", "Audit code", "Identificador da auditoria.", "Audit identifier.", "Audit.Audit_Code"),
      AuditStatus: fieldMeta("Status", "Status", "Status operacional da auditoria.", "Operational audit status.", "Audit.Audit_Status"),
      AuditStartDate: fieldMeta("Data de início", "Start date", "Data de início da auditoria.", "Audit start date.", "Audit.Audit_StartDate"),
      AuditEndDate: fieldMeta("Data de término", "End date", "Data de término da auditoria.", "Audit end date.", "Audit.Audit_EndDate"),
      AuditorName: fieldMeta("Auditor", "Auditor", "Pessoa que executou a auditoria.", "Person who executed the audit.", "Person.Person_Name"),
      AuditDepartmentCodeDescription: fieldMeta("Departamento", "Department", "Departamento associado à auditoria.", "Department associated with the audit.", "Department.Department_Description"),
    },
    concepts: [
      { conceptKey: "company", field: "CompanyCorporateName", label: { "pt-BR": "Empresa", "en-US": "Company" } },
      { conceptKey: "owner", field: "AuditorName", label: { "pt-BR": "Auditor", "en-US": "Auditor" } },
      { conceptKey: "department", field: "AuditDepartmentCodeDescription", label: { "pt-BR": "Departamento", "en-US": "Department" } },
      { conceptKey: "date", field: "AuditStartDate", label: { "pt-BR": "Data de início", "en-US": "Start date" } },
      { conceptKey: "stage", field: "AuditStatus", label: { "pt-BR": "Status", "en-US": "Status" } },
    ],
    statusField: "AuditStatus",
    ownerField: "AuditorName",
    dateField: "AuditStartDate",
    focusField: "AuditDepartmentCodeDescription",
    correlations: [
      {
        leftField: "AuditorName",
        rightField: "AuditDepartmentCodeDescription",
        rationalePt: "Mostra quais auditores concentram maior volume por departamento.",
        rationaleEn: "Shows which auditors concentrate the largest volume by department.",
      },
    ],
  }),
  "atividades-de-auditoria": createDefinition({
    title: { "pt-BR": "Atividades de Auditoria", "en-US": "Audit Activities" },
    overview: {
      "pt-BR":
        "Detalha ações derivadas de auditorias, com foco em responsáveis, estágio, datas e contexto operacional.",
      "en-US":
        "Details actions derived from audits, focusing on owners, stage, dates, and operational context.",
    },
    fieldMeta: {
      activityCode: fieldMeta("Código da atividade", "Activity code", "Identificador da atividade.", "Activity identifier.", "Activity.Activity_Code"),
      activityTitle: fieldMeta("Título da atividade", "Activity title", "Título resumido da atividade.", "Short title of the activity.", "Activity.Activity_Title"),
      activityDetail: fieldMeta("Ação", "Action", "Descrição detalhada da atividade.", "Detailed activity description.", "Activity.Activity_Detail"),
      activityContextCode: fieldMeta("Código do contexto", "Context code", "Contexto associado à atividade.", "Context associated with the activity.", "Activity.Activity_ContextCode"),
      activityParentCode: fieldMeta("Código da atividade pai", "Parent activity code", "Código da atividade pai vinculada.", "Code of the linked parent activity.", "Activity.Activity_ParentCode"),
      activityUserModification: fieldMeta("Usuário modificador", "Modifying user", "Usuário que alterou a atividade.", "User who modified the activity.", "Activity.Activity_UserModification"),
      activityTupleCreatedIn: fieldMeta("Criada em", "Created on", "Data de criação da atividade.", "Activity creation date.", "Activity.Activity_TupleCreatedIn"),
      activityTupleModifiedIn: fieldMeta("Atualizada em", "Modified on", "Data da última atualização da atividade.", "Date of the latest activity update.", "Activity.Activity_TupleModifiedIn"),
      activityTupleExcluded: fieldMeta("Excluída", "Excluded", "Indica exclusão lógica da atividade.", "Indicates logical exclusion of the activity.", "Activity.Activity_TupleExcluded"),
      activityCompanyCorporateName: fieldMeta("Empresa da atividade", "Activity company", "Empresa associada ao contexto da atividade.", "Company associated with the activity context.", "Company.Company_CorporateName"),
      activityProjectName: fieldMeta("Projeto da atividade", "Activity project", "Nome do projeto vinculado à atividade.", "Project name linked to the activity.", "Project.Project_Name"),
      activityIssueDescription: fieldMeta("Issue da atividade", "Activity issue", "Descrição da issue vinculada à atividade.", "Issue description linked to the activity.", "Issue.Issue_Description"),
      activityReleaseDescription: fieldMeta("Release da atividade", "Activity release", "Descrição da release vinculada à atividade.", "Release description linked to the activity.", "Release.Release_Description"),
      activityUrl: fieldMeta("URL da atividade", "Activity URL", "Link direto para edição ou consulta da atividade.", "Direct link for editing or viewing the activity.", "Derived SQL alias"),
      activityStageDescription: fieldMeta("Estágio", "Stage", "Estágio atual da atividade.", "Current stage of the activity.", "WorkflowStages.WorkflowStages_Description"),
      ActivityStagesDescription: fieldMeta("Estágio", "Stage", "Etapa atual da atividade no workflow.", "Current workflow stage of the activity.", "WorkflowStages.WorkflowStages_Description"),
      activityImplementedDate: fieldMeta("Implementada em", "Implemented on", "Data de implementação da ação.", "Action implementation date.", "Activity.Activity_ImplementedDate"),
      ActivityResponsiblePersonName: fieldMeta("Responsável pela ação", "Action owner", "Pessoa responsável por executar a ação.", "Person responsible for executing the action.", "ActivityWorkflowStages responsible join"),
      ActivityRequesterPersonName: fieldMeta("Solicitante da ação", "Action requester", "Pessoa que solicitou a atividade.", "Person who requested the activity.", "ActivityWorkflowStages requester join"),
      auditCode: fieldMeta("Código da auditoria", "Audit code", "Identificador da auditoria vinculada à atividade.", "Identifier of the audit linked to the activity.", "Audit.Audit_Code"),
      auditCompanyCorporateName: fieldMeta("Empresa da auditoria", "Audit company", "Empresa associada ao contexto da auditoria.", "Company associated with the audit context.", "Company.Company_CorporateName"),
      auditTypeAuditDescription: fieldMeta("Tipo de auditoria", "Audit type", "Descrição do tipo de auditoria.", "Description of the audit type.", "TypeAudit.TypeAudit_Description"),
      auditAuditorPersonName: fieldMeta("Auditor", "Auditor", "Nome da pessoa auditora.", "Name of the auditor.", "Person.Person_Name"),
      auditResponsiblePersonName: fieldMeta("Responsável pela auditoria", "Audit responsible owner", "Nome do responsável pela auditoria.", "Name of the person responsible for the audit.", "Person.Person_Name"),
      auditDepartmentDescription: fieldMeta("Departamento da auditoria", "Audit department", "Departamento da auditoria de origem.", "Department of the originating audit.", "Department.Department_Description"),
      auditSectorDescription: fieldMeta("Setor da auditoria", "Audit sector", "Setor da auditoria de origem.", "Sector of the originating audit.", "Sector.Sector_Description"),
      auditIndustrialMachineDescription: fieldMeta("Máquina da auditoria", "Audit machine", "Máquina industrial associada à auditoria.", "Industrial machine associated with the audit.", "IndustrialMachine.IndustrialMachine_Description"),
      auditLevelDescription: fieldMeta("Nível da auditoria", "Audit level", "Nível da auditoria que originou a ação.", "Audit level that originated the action.", "AuditLevel.AuditLevel_Description"),
      auditAnswerCode: fieldMeta("Código da resposta da auditoria", "Audit answer code", "Identificador da resposta de auditoria.", "Identifier of the audit answer.", "AuditAnswer.AuditAnswer_Code"),
      auditAnswerOptionDescription: fieldMeta("Descrição da opção", "Option description", "Descrição da opção selecionada no formulário da auditoria.", "Description of the option selected in the audit form.", "SmartFormSectionsFieldsOptions.SmartFormSectionsFieldsOptions_Description"),
      Issue: commonFieldMeta.Issue,
      activitySectorDescription: fieldMeta("Setor da atividade", "Activity sector", "Setor associado à atividade.", "Sector associated with the activity.", "Sector.Sector_Description"),
    },
    concepts: [
      { conceptKey: "owner", field: "ActivityResponsiblePersonName", label: { "pt-BR": "Responsável", "en-US": "Owner" } },
      { conceptKey: "department", field: "auditDepartmentDescription", label: { "pt-BR": "Departamento", "en-US": "Department" } },
      { conceptKey: "sector", field: "auditSectorDescription", label: { "pt-BR": "Setor", "en-US": "Sector" } },
      { conceptKey: "stage", field: "ActivityStagesDescription", label: { "pt-BR": "Estágio", "en-US": "Stage" } },
      { conceptKey: "date", field: "activityTupleCreatedIn", label: { "pt-BR": "Criada em", "en-US": "Created on" } },
    ],
    statusField: "ActivityStagesDescription",
    ownerField: "ActivityResponsiblePersonName",
    dateField: "activityTupleCreatedIn",
    focusField: "auditDepartmentDescription",
    correlations: [
      {
        leftField: "ActivityResponsiblePersonName",
        rightField: "ActivityStagesDescription",
        rationalePt: "Ajuda a entender se o backlog está concentrado em responsáveis específicos.",
        rationaleEn: "Helps understand whether backlog is concentrated among specific owners.",
      },
    ],
  }),
  "nao-conformidade": createDefinition({
    title: { "pt-BR": "Não Conformidade", "en-US": "Non-conformity" },
    overview: {
      "pt-BR":
        "Centraliza desvios e não conformidades com ligação para ações corretivas, responsáveis e áreas afetadas.",
      "en-US":
        "Centralizes deviations and non-conformities linked to corrective actions, owners, and affected areas.",
    },
    fieldMeta: {
      nonconformityCode: fieldMeta("Código da não conformidade", "Non-conformity code", "Identificador da não conformidade.", "Non-conformity identifier.", "NonConformity"),
      nonconformityStatus: fieldMeta("Status", "Status", "Status atual da não conformidade.", "Current non-conformity status.", "WorkflowStages.WorkflowStages_Description"),
      ActivityResponsiblePersonName: fieldMeta("Responsável", "Owner", "Pessoa responsável pela ação corretiva.", "Owner of the corrective action.", "ActivityWorkflowStages responsible join"),
      activityTupleCreatedIn: fieldMeta("Criada em", "Created on", "Data de criação da ação ligada à não conformidade.", "Creation date of the action linked to the non-conformity.", "Activity.Activity_TupleCreatedIn"),
      auditDepartmentDescription: fieldMeta("Departamento da auditoria", "Audit department", "Departamento vinculado à origem da não conformidade.", "Department linked to the non-conformity source.", "Department"),
      ActivityStagesDescription: fieldMeta("Status", "Status", "Etapa atual da ação corretiva no workflow.", "Current workflow stage of the corrective action.", "WorkflowStages.WorkflowStages_Description"),
    },
    concepts: [
      { conceptKey: "owner", field: "ActivityResponsiblePersonName", label: { "pt-BR": "Responsável", "en-US": "Owner" } },
      { conceptKey: "department", field: "auditDepartmentDescription", label: { "pt-BR": "Departamento", "en-US": "Department" } },
      { conceptKey: "stage", field: "ActivityStagesDescription", label: { "pt-BR": "Status", "en-US": "Status" } },
      { conceptKey: "date", field: "activityTupleCreatedIn", label: { "pt-BR": "Criada em", "en-US": "Created on" } },
    ],
    statusField: "ActivityStagesDescription",
    ownerField: "ActivityResponsiblePersonName",
    dateField: "activityTupleCreatedIn",
    focusField: "auditDepartmentDescription",
    correlations: [
      {
        leftField: "ActivityStagesDescription",
        rightField: "ActivityResponsiblePersonName",
        rationalePt: "Relaciona o estágio do desvio com os responsáveis pelas ações corretivas.",
        rationaleEn: "Relates deviation stage to corrective action owners.",
      },
    ],
  }),
  "ocorrencias-com-e-sem-atividade": createDefinition({
    title: { "pt-BR": "Ocorrências com e sem Atividade", "en-US": "Occurrences with and without Activity" },
    overview: {
      "pt-BR":
        "Compara ocorrências que já receberam ação com aquelas ainda sem desdobramento operacional.",
      "en-US":
        "Compares occurrences that already received action with those still lacking operational follow-up.",
    },
    fieldMeta: {
      "Issue #": fieldMeta("Nº da issue", "Issue #", "Identificador da ocorrência.", "Occurrence identifier.", "Occurrence"),
      Occurrence: fieldMeta("Ocorrência", "Occurrence", "Descrição da ocorrência.", "Occurrence description.", "Occurrence"),
      Activity_open: fieldMeta("Ação aberta", "Open activity", "Indica se a ocorrência possui ação aberta vinculada.", "Whether the occurrence has an open linked activity.", "Derived SQL alias"),
      Champion: commonFieldMeta.Champion,
      "Focus Factory": commonFieldMeta["Focus Factory"],
      "Issue Date": commonFieldMeta["Issue Date"],
      Status_Occurrence: commonFieldMeta.Status_Occurrence,
    },
    concepts: [
      { conceptKey: "focusFactory", field: "Focus Factory", label: { "pt-BR": "Focus Factory", "en-US": "Focus Factory" } },
      { conceptKey: "owner", field: "Champion", label: { "pt-BR": "Champion", "en-US": "Champion" } },
      { conceptKey: "occurrenceStatus", field: "Status_Occurrence", label: { "pt-BR": "Status", "en-US": "Status" } },
      { conceptKey: "date", field: "Issue Date", label: { "pt-BR": "Data da ocorrência", "en-US": "Issue date" } },
    ],
    statusField: "Status_Occurrence",
    ownerField: "Champion",
    dateField: "Issue Date",
    focusField: "Focus Factory",
    correlations: [
      {
        leftField: "Focus Factory",
        rightField: "Activity_open",
        rationalePt: "Mostra onde ainda há maior volume de ocorrências sem ação vinculada.",
        rationaleEn: "Shows where there is still a higher volume of occurrences without linked action.",
      },
    ],
  }),
  "ocorrencias-com-indicador": createDefinition({
    title: { "pt-BR": "Ocorrências com Indicador", "en-US": "Occurrences with Indicator" },
    overview: {
      "pt-BR":
        "Relaciona ocorrências a indicadores, permitindo leitura de status, champion, foco fabril e evolução temporal.",
      "en-US":
        "Links occurrences to indicators, enabling analysis of status, champion, plant focus, and time evolution.",
    },
    fieldMeta: {
      "Issue #": fieldMeta("Nº da issue", "Issue #", "Identificador da ocorrência.", "Occurrence identifier.", "Occurrence"),
      "Type Occurrence": commonFieldMeta["Type Occurrence"],
      Champion: commonFieldMeta.Champion,
      "Focus Factory": commonFieldMeta["Focus Factory"],
      Status_Occurrence: commonFieldMeta.Status_Occurrence,
      "Issue Date": commonFieldMeta["Issue Date"],
      Indicator: commonFieldMeta.Indicator,
    },
    concepts: [
      { conceptKey: "focusFactory", field: "Focus Factory", label: { "pt-BR": "Focus Factory", "en-US": "Focus Factory" } },
      { conceptKey: "owner", field: "Champion", label: { "pt-BR": "Champion", "en-US": "Champion" } },
      { conceptKey: "occurrenceStatus", field: "Status_Occurrence", label: { "pt-BR": "Status", "en-US": "Status" } },
      { conceptKey: "indicator", field: "Indicator", label: { "pt-BR": "Indicador", "en-US": "Indicator" } },
      { conceptKey: "date", field: "Issue Date", label: { "pt-BR": "Data da ocorrência", "en-US": "Issue date" } },
    ],
    statusField: "Status_Occurrence",
    ownerField: "Champion",
    dateField: "Issue Date",
    focusField: "Focus Factory",
    correlations: [
      {
        leftField: "Indicator",
        rightField: "Focus Factory",
        rationalePt: "Ajuda a identificar quais focos fabris concentram determinados indicadores.",
        rationaleEn: "Helps identify which plant focus areas concentrate specific indicators.",
      },
      {
        leftField: "Champion",
        rightField: "Status_Occurrence",
        rationalePt: "Permite avaliar se status críticos estão concentrados em poucos champions.",
        rationaleEn: "Allows evaluation of whether critical statuses are concentrated in a few champions.",
      },
    ],
  }),
  "ocorrencias-ff": createDefinition({
    title: { "pt-BR": "Ocorrências FF", "en-US": "FF Occurrences" },
    overview: {
      "pt-BR":
        "Foca nas ocorrências FF para priorização de falhas, máquinas, champions e backlog associado.",
      "en-US":
        "Focuses on FF occurrences to prioritize failures, machines, champions, and associated backlog.",
    },
    fieldMeta: {
      "Issue #": fieldMeta("Nº da issue", "Issue #", "Identificador da ocorrência FF.", "FF occurrence identifier.", "Occurrence"),
      "Issue Date": commonFieldMeta["Issue Date"],
      "Focus Factory": commonFieldMeta["Focus Factory"],
      Champion: commonFieldMeta.Champion,
      Indicator: commonFieldMeta.Indicator,
      "Machine / Station resp.": fieldMeta("Máquina / estação", "Machine / station", "Máquina ou estação responsável pelo evento.", "Machine or station responsible for the event.", "Derived SQL alias"),
      Activity_open: fieldMeta("Ação aberta", "Open activity", "Volume de ações abertas vinculadas.", "Volume of linked open actions.", "Derived SQL alias"),
      Status_Occurrence: commonFieldMeta.Status_Occurrence,
    },
    concepts: [
      { conceptKey: "focusFactory", field: "Focus Factory", label: { "pt-BR": "Focus Factory", "en-US": "Focus Factory" } },
      { conceptKey: "owner", field: "Champion", label: { "pt-BR": "Champion", "en-US": "Champion" } },
      { conceptKey: "indicator", field: "Indicator", label: { "pt-BR": "Indicador", "en-US": "Indicator" } },
      { conceptKey: "occurrenceStatus", field: "Status_Occurrence", label: { "pt-BR": "Status", "en-US": "Status" } },
      { conceptKey: "date", field: "Issue Date", label: { "pt-BR": "Data da ocorrência", "en-US": "Issue date" } },
    ],
    statusField: "Status_Occurrence",
    ownerField: "Champion",
    dateField: "Issue Date",
    focusField: "Machine / Station resp.",
    correlations: [
      {
        leftField: "Machine / Station resp.",
        rightField: "Indicator",
        rationalePt: "Ajuda a identificar máquinas onde falha e indicador aparecem juntos.",
        rationaleEn: "Helps identify machines where failure and indicator appear together.",
      },
      {
        leftField: "Champion",
        rightField: "Activity_open",
        rationalePt: "Permite avaliar se o backlog de ações está concentrado em poucos champions.",
        rationaleEn: "Allows evaluation of whether action backlog is concentrated in a few champions.",
      },
    ],
  }),
  "atividades-completas": createDefinition({
    title: { "pt-BR": "Atividades Completas", "en-US": "Completed Activities" },
    overview: {
      "pt-BR":
        "Catálogo amplo de atividades completas, útil para análise histórica e de produtividade operacional.",
      "en-US":
        "Broad catalog of completed activities, useful for historical and operational productivity analysis.",
    },
    fieldMeta: {
      activityCode: fieldMeta("Código da atividade", "Activity code", "Identificador da atividade.", "Activity identifier.", "Activity.Activity_Code"),
      activityTitle: fieldMeta("Título da atividade", "Activity title", "Título resumido da atividade.", "Short title of the activity.", "Activity.Activity_Title"),
      activityDetail: fieldMeta("Ação", "Action", "Descrição da atividade.", "Activity description.", "Activity.Activity_Detail"),
      ActivityResponsiblePersonName: fieldMeta("Responsável pela ação", "Action owner", "Pessoa responsável pela ação.", "Person responsible for the action.", "ActivityWorkflowStages"),
      activityTupleCreatedIn: fieldMeta("Criada em", "Created on", "Data de criação da atividade.", "Activity creation date.", "Activity.Activity_TupleCreatedIn"),
      activityImplementedDate: fieldMeta("Implementada em", "Implemented on", "Data de implementação.", "Implementation date.", "Activity.Activity_ImplementedDate"),
      RequesterPersonName: fieldMeta("Solicitante", "Requester", "Pessoa que solicitou a atividade.", "Person who requested the activity.", "Person.Person_Name"),
      ResponsiblePersonName: fieldMeta("Responsável", "Responsible owner", "Pessoa responsável pela atividade.", "Person responsible for the activity.", "Person.Person_Name"),
      MainWorkflowStagesDescription: fieldMeta("Etapa principal do workflow", "Main workflow stage", "Etapa principal do workflow da atividade.", "Main workflow stage of the activity.", "WorkflowStages.WorkflowStages_Description"),
      Status_occurrence: fieldMeta("Status da ocorrência", "Occurrence status", "Status consolidado da ocorrência vinculada à atividade.", "Consolidated status of the occurrence linked to the activity.", "Derived SQL alias"),
    },
    concepts: [
      { conceptKey: "owner", field: "ActivityResponsiblePersonName", label: { "pt-BR": "Responsável", "en-US": "Owner" } },
      { conceptKey: "date", field: "activityImplementedDate", label: { "pt-BR": "Implementada em", "en-US": "Implemented on" } },
    ],
    ownerField: "ActivityResponsiblePersonName",
    dateField: "activityImplementedDate",
    focusField: "ActivityResponsiblePersonName",
    correlations: [
      {
        leftField: "ActivityResponsiblePersonName",
        rightField: "activityImplementedDate",
        rationalePt: "Ajuda a comparar responsáveis e ritmo de conclusão das atividades.",
        rationaleEn: "Helps compare owners and completion pace of activities.",
      },
    ],
  }),
};

export function getFieldMeta(reportId: string, fieldName: string): FieldMeta | undefined {
  const fieldMetaMap = getReportFieldMetaMap(reportId);
  if (Object.keys(fieldMetaMap).length === 0) {
    return undefined;
  }

  const direct = fieldMetaMap[fieldName];
  if (direct) {
    return direct;
  }

  const normalizedFieldName = normalizeFieldKey(fieldName);
  const normalizedMatch = Object.entries(fieldMetaMap).find(
    ([key]) => normalizeFieldKey(key) === normalizedFieldName,
  );

  if (normalizedMatch?.[1]) {
    return normalizedMatch[1];
  }

  return autoFieldMeta(fieldName, fieldName);
}

export function getReportConceptEntries(reportId: string): ReportConceptEntry[] {
  return reportSemantics[reportId]?.concepts ?? [];
}

export function getReportSemanticView(
  reportId: string,
  rows: ReportRecord[],
  locale: Locale,
): ReportSemanticView {
  const semantic = reportSemantics[reportId];

  if (!semantic) {
    return {
      overview: "",
      kpis: [],
      charts: [],
      correlations: [],
      fieldMeta: {},
    };
  }

  return {
    overview: semantic.overview[locale],
    fieldMeta: getReportFieldMetaMap(reportId),
    kpis: semantic.kpis.map((kpi) => ({
      id: kpi.id,
      label: kpi.label[locale],
      value: kpi.compute(rows, locale),
      detail: kpi.description[locale],
      tooltip: `${kpi.description[locale]} Fonte: ${kpi.source}`,
    })),
    charts: semantic.charts.map((chart) => ({
      id: chart.id,
      chartType: chart.chartType,
      title: chart.title[locale],
      categoryField: chart.categoryField,
      valueField: chart.valueField,
      dateField: chart.dateField,
      description: chart.description[locale],
    })),
    correlations: semantic.correlations.map((correlation) => ({
      id: correlation.id,
      leftField: correlation.leftField,
      rightField: correlation.rightField,
      rationale: correlation.rationale[locale],
    })),
  };
}

export function getReportTitle(reportId: string, locale: Locale, fallbackTitle: string): string {
  return reportSemantics[reportId]?.title[locale] ?? fallbackTitle;
}
