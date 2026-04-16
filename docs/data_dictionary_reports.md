# Data Dictionary And Report Correlations

## Scope

This document is the initial data dictionary for the SQL reports stored in `database/views/mysql/`.

Important:

- this dictionary is inferred from the SQL aliases and joins currently versioned in the repository
- it is not yet a business-approved glossary
- fields marked as inferred should be validated with the business owners before becoming official KPI definitions

## Registered Reports

The backend currently exposes these SQL reports through `/api/v1/reports/{report_id}`:

- `atividades-completas`
- `atividades-de-auditoria`
- `auditorias-planejadas`
- `auditorias-realizadas`
- `nao-conformidade`
- `ocorrencias-com-e-sem-atividade`
- `ocorrencias-com-indicador`
- `ocorrencias-ff`

## Detailed Dictionary

### `auditorias-planejadas`

Source SQL: `database/views/mysql/auditorias_planejadas.sql`

| Field | Meaning | Source |
|---|---|---|
| `AuditingPlanningCode` | Planning record identifier for the scheduled audit. | `AuditingPlanning.AuditingPlanning_Code` |
| `ContextCode` | Context identifier linked to the planning record. Inferred. | `AuditingPlanning.AuditingPlanning_ContextCode` |
| `CompanyCode` | Company identifier derived from the planning context. | `Company.Company_Code` |
| `CompanyCorporateName` | Corporate name of the company tied to the audit planning. | `Company.Company_CorporateName` |
| `AuditingPlanningPlannedDate` | Original planned date for the audit. | `AuditingPlanning.AuditingPlanning_PlannedDate` |
| `AuditingPlanningReplannedDate` | Rescheduled date for the audit when the original date changed. Inferred. | `AuditingPlanning.AuditingPlanning_ReplannedDate` |
| `AuditingPlanningFrequency` | Frequency code or cadence of the planning. Inferred and needs business validation. | `AuditingPlanning.AuditingPlanning_Frequency` |
| `AuditingPlanningUserModification` | Identifier of the user who last modified the planning record. | `AuditingPlanning.AuditingPlanning_UserModification` |
| `AuditingPlanningTupleCreatedIn` | Timestamp when the planning record was created. | `AuditingPlanning.AuditingPlanning_TupleCreatedIn` |
| `AuditingPlanningTupleModifiedIn` | Timestamp of the latest modification. | `AuditingPlanning.AuditingPlanning_TupleModifiedIn` |
| `AuditingPlanningTupleExcluded` | Logical exclusion flag for the planning record. Inferred. | `AuditingPlanning.AuditingPlanning_TupleExcluded` |
| `AuditingPlanningGuid` | Global identifier for the planning record. | `AuditingPlanning.AuditingPlanning_Guid` |
| `AuditingPlanningDepartmentCodeCode` | Department identifier associated with the planned audit. | `AuditingPlanning.AuditingPlanning_DepartmentCode` |
| `AuditingPlanningDepartmentCodeDescription` | Department description associated with the planning. | `Department.Department_Description` |
| `ResponsibleCode` | Identifier of the responsible person. | `AuditingPlanning.AuditingPlanning_ResponsiblePersonCode` |
| `ResponsibleName` | First name of the responsible person. | `Person.Person_Name` |
| `ResponsibleLastName` | Last name of the responsible person. | `Person.Person_LastName` |
| `ResponsibleDocumentType` | Document type code of the responsible person. Inferred and needs business validation. | `Person.Person_DocumentType` |
| `ResponsibleDocumentNumber` | Document number of the responsible person. Sensitive field; avoid exposing broadly in dashboards. | `Person.Person_DocumentNumber` |
| `AuditingPlanningTypeAuditCodeCode` | Audit type code linked to the planning. | `AuditingPlanning.AuditingPlanning_TypeAuditCode` |
| `AuditingPlanningTypeAuditCodeDescription` | Human-readable description of the audit type. | `TypeAudit.TypeAudit_Description` |
| `AuditingPlanningAuditLevelCodeCode` | Audit level code linked to the planning. | `AuditingPlanning.AuditingPlanning_AuditLevelCode` |
| `AuditingPlanningAuditLevelCodeDescription` | Human-readable description of the audit level. | `AuditLevel.AuditLevel_Description` |
| `Sector_Description` | Sector description associated with the planning through `AuditingPlanningSector`. | `Sector.Sector_Description` |

## Summary Dictionary By Report

### `atividades-completas`

- Business grain:
  One record per activity.
- Main technical anchors:
  `ActivityCode`, `ContextCode`, `CompanyCode`, `ActivityProjectCodeCode`, `ActivityEpicCodeCode`, `ActivityIssueCodeCode`.
- Typical business use:
  operational backlog, activity portfolio, deadlines, complexity, ownership and execution tracking.

### `atividades-de-auditoria`

- Business grain:
  one row per activity linked to an audit answer, enriched with full audit context.
  Activities without an audit answer are excluded (`Activity_AuditAnswerCode IS NOT NULL`).
  Logically deleted activities and audits are excluded (`Activity_TupleExcluded = 0`, `Audit_TupleExcluded = 0`).
  Workflow stage: only the most recent active stage per activity (deduplication via `MAX(ActivityWorkflowStages_Code)` — no fanout).
- Main technical anchors:
  `activityCode`, `auditCode`, `activityAuditAnswerCode` (inner only), `typeAuditCode` (inner only), `auditLevelCode` (inner only).
- Exposed fields (outer SELECT — 28 columns):

  | Field | Semantic type | Notes |
  |---|---|---|
  | `activityCode` | Key | Primary activity identifier |
  | `activityTitle` | Text | Activity title |
  | `activityDetail` | Text | Detail with HTML stripped |
  | `activityTupleCreatedIn` | Date | Record creation timestamp |
  | `activityImplementedDate` | Date | Implementation date |
  | `activitySectorDescription` | Dimension | Sector of the activity |
  | `activityCompanyCorporateName` | Dimension | Company via activity context |
  | `ActivityStagesDescription` | Status | Most recent active workflow stage |
  | `activityUrl` | Link | Deep link to activity edit page |
  | `auditCode` | Key | Primary audit identifier |
  | `auditCompanyCorporateName` | Dimension | Company via audit context |
  | `auditTypeAuditDescription` | Dimension | Audit type |
  | `auditAuditorPersonName` | Person | Auditor name |
  | `auditResponsiblePersonName` | Person | Responsible person for the audit |
  | `auditDepartmentDescription` | Dimension | Department of the audit |
  | `auditSectorDescription` | Dimension | Sector of the audit |
  | `auditIndustrialMachineDescription` | Dimension | Industrial machine linked to audit |
  | `auditLevelDescription` | Dimension | Audit level |
  | `ActivityRequesterPersonName` | Person | Requester from most recent workflow stage |
  | `ActivityResponsiblePersonName` | Person | Responsible from most recent workflow stage |
  | `auditScore` | Metric | Final audit score |
  | `auditStatus` | Status | Audit status code |
  | `auditEndDate` | Date | Audit end date |
  | `auditPlannedDate` | Date | Audit planned date |
  | `activityDeadline` | Date | Activity deadline |
  | `activityPlannedDate` | Date | Activity planned date |
  | `activityClosed` | Status | Whether the activity is closed |
  | `activityFailed` | Status | Whether the activity is marked as failed |

- Typical business use:
  audit-driven corrective action tracking; workflow stage visibility; score and deadline monitoring per audit cycle.
- Correlations:
  - `auditorias-realizadas`: join on `auditCode`
  - `auditorias-planejadas`: join via `auditAuditingPlanningCode` (available in inner query only)
  - `nao-conformidade`: strong overlap via `activityCode`, `activityOccurrenceCode`, `auditCode`
  - `atividades-completas`: `atividades-de-auditoria` is a filtered subset; join on `activityCode`
  - `ocorrencias-*`: indirect via `activityOccurrenceCode` (available in inner query only)

### `auditorias-planejadas`

- Business grain:
  one planned audit entry, possibly repeated by sector because of the sector join.
- Main technical anchors:
  `AuditingPlanningCode`, `ContextCode`, `CompanyCode`, `ResponsibleCode`, `AuditingPlanningTypeAuditCodeCode`.
- Typical business use:
  future schedule, responsible mapping, planned audit coverage.

### `auditorias-realizadas`

- Business grain:
  one executed audit, filtered to `Audit_Status = 3`.
- Main technical anchors:
  `AuditCode`, `AuditAuditingPlanningCodeCode`, `TypeAuditCode`, `AuditLevelCode`, `ResponsibleCode`, `AuditorCode`.
- Typical business use:
  completed audit history, score analysis, execution performance.

### `nao-conformidade`

- Business grain:
  non-conformity style projection centered on activities that already have an audit answer.
- Main technical anchors:
  `activityCode`, `auditCode`, `activityOccurrenceCode`, `activityOccurrenceCausesCode`.
- Typical business use:
  corrective action traceability tied to audits and workflow stages.

### `ocorrencias-com-e-sem-atividade`

- Business grain:
  occurrence records joined with activities when they exist.
- Main technical anchors:
  `codigo_ocorrencia`, `codigo_atividade`, `guid_ocorrencia`, `guid_atividade`.
- Typical business use:
  issue management with or without generated activities, ownership and timeline analysis.

### `ocorrencias-com-indicador`

- Business grain:
  occurrence/quality incident records enriched with product, customer, cost and corrective-action context.
- Main technical anchors:
  `Issue #`, `Project`, `Customer Plant`, `Type Occurrence`, `Champion`.
- Typical business use:
  executive quality dashboards and KPI drill-down.

### `ocorrencias-ff`

- Business grain:
  occurrence records very similar to `ocorrencias-com-indicador`, with emphasis on immediate cause and immediate action.
- Main technical anchors:
  `Issue #`, `Immediate Cause`, `Action Implemented (Immediate Action)`, `Defect`.
- Typical business use:
  fast-failure and immediate-containment analysis. Inferred from field naming.

## Correlation Map

The reports do appear to be correlated. The strongest relationships inferred from the SQL are:

### Planning to Execution

- `auditorias-planejadas` connects to `auditorias-realizadas`
- inferred key:
  `AuditingPlanning.AuditingPlanning_Code = Audit.Audit_AuditingPlanningCode`
- business meaning:
  a planned audit can be linked to a realized audit execution

### Audit to Activities

- `auditorias-realizadas` connects to `atividades-de-auditoria` and `nao-conformidade`
- inferred path:
  `Audit.Audit_Code -> AuditAnswer.Audit_Code -> Activity.Activity_AuditAnswerCode`
- business meaning:
  audits generate or relate to activity-level actions and findings

### Activities Core

- `atividades-completas` is the broadest activity-centric base
- it likely overlaps strongly with `atividades-de-auditoria` and parts of `nao-conformidade`
- likely common anchor:
  `Activity_Code`

### Occurrence to Activities

- `ocorrencias-com-e-sem-atividade` explicitly links occurrences and activities
- inferred key:
  `Activity.Activity_OccurrenceCode = Occurrence.Occurrence_Code`
- business meaning:
  an occurrence may or may not have a generated activity, and the report was designed to show both states

### Occurrence Family

- `ocorrencias-com-indicador` and `ocorrencias-ff` are highly correlated
- likely common anchor:
  `Occurrence.Occurrence_Code`
- likely business difference:
  one is KPI-oriented and one emphasizes immediate cause/action details

### Shared Dimensions

Multiple reports reuse the same master dimensions, which means they can be correlated at least analytically even when they are not row-for-row identical:

- company
- context
- department
- sector
- person
- type audit
- audit level
- project

## Risks And Caveats

- some queries may duplicate business entities because of one-to-many joins such as sector mappings
- several fields are codes whose enumerations are not yet documented
- some aliases expose personal document data and should not be shown in executive dashboards by default
- correlation described here is an inference from SQL structure and must be validated against business rules before becoming official documentation
