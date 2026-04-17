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

> **Filtro de soft-delete aplicado (task #28, Opção A):** esta view agora
> filtra `WHERE AuditingPlanning_TupleExcluded = 0`.

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

> **Filtro de soft-delete aplicado (task #28, Opção A):** esta view agora
> filtra `WHERE Audit_TupleExcluded = 0` (além do `Audit_Status = 3` já
> existente).

- Business grain:
  one executed audit, filtered to `Audit_Status = 3` and `Audit_TupleExcluded = 0`.
- Main technical anchors:
  `AuditCode`, `AuditAuditingPlanningCodeCode`, `TypeAuditCode`, `AuditLevelCode`, `ResponsibleCode`, `AuditorCode`.
- Typical business use:
  completed audit history, score analysis, execution performance.

#### `Audit_Status` enumeration (empirically validated — 2026-04-16 sanity check)

`Audit.Audit_Status` is a raw integer without a dedicated lookup table (unlike
`OccurrenceStatus` which has `OccurrenceStatus_Description`). The values below
were validated empirically against the `Dealer_Magna_Treino` database on
2026-04-16 during the Fase B sanity check (Task #31).

| Value | Meaning (empirical) | Certainty | Evidence (Dealer_Magna_Treino, 2026-04-16) |
|---|---|---|---|
| `1` | Rascunho / Draft | Medium | 11 rows. All have sentinel `Audit_EndDate = '1000-01-01'`. Zero have `Audit_AuditingPlanningCode`. No `Audit_Score`. |
| `2` | **Finalizada / Concluída (Realized)** | **High** | 208 rows. **All 208** have real `Audit_EndDate`. **14** have `Audit_AuditingPlanningCode` linking them to planning records. This is the only status where audits are linked to plans. |
| `3` | Em andamento / Avulsa (In Progress or Ad-hoc) | **High** | 126 rows. **Zero** have `Audit_AuditingPlanningCode`. All have sentinel `Audit_EndDate = '1000-01-01'`. No link to planning records whatsoever. |

> **CRITICAL CORRECTION (2026-04-16):** The original assumption (Status=3 = "Realizada") was
> based on the legacy `auditorias_realizadas.sql` view filter `WHERE Audit_Status = 3`. However,
> empirical analysis shows Status=3 rows have **zero link** to `AuditingPlanning` via
> `Audit_AuditingPlanningCode` and **no real** `Audit_EndDate`. Status=2 is the correct filter
> for realized audits linked to planning. The `audits_kpi_base.sql` subquery must use
> `Audit_Status IN (2, 3)` (or just `2`) to capture executions.

#### Sentinel date convention `1000-01-01` (discovered 2026-04-16)

The ERP uses `1000-01-01 00:00:00` as a sentinel value for "not set" instead of
`NULL` in several datetime columns:

| Table.Column | Sentinel rows | Total active rows | Impact |
|---|---|---|---|
| `AuditingPlanning.AuditingPlanning_ReplannedDate` | 128 | 229 (55.9%) | Treated as real replan, inflating `IsReplanned` and corrupting `EffectiveDate` |
| `AuditingPlanning.AuditingPlanning_PlannedDate` | 2 | 229 (0.9%) | Minor but causes NULL effective date |
| `Audit.Audit_EndDate` (Status=1,3) | 137 | 345 | Sentinel marks unfinished audits |
| `Audit.Audit_StartDate` (some Status=2) | ~1 | 208 | Rare edge case |

**Fix required**: All queries reading these columns must apply `NULLIF(column, '1000-01-01')`
or `CASE WHEN column = '1000-01-01' THEN NULL END` before date arithmetic. The Python
layer should also treat `date(1000, 1, 1)` as `None` in `_parse_iso_date()` as defence
in depth.

**Open questions for DBA**:
- Whether Status=3 has different semantics in production vs treino database.
- Whether other sentinel dates exist (e.g. `9999-12-31` for "far future").
- Full domain of `Audit_Status` values beyond 1-3.

### `audits_kpi_base`

Source SQL: `database/views/mysql/audits_kpi_base.sql`

View dedicada aos **4 KPIs executivos de auditoria** (Fase B do MVP):
Aderência (% realizadas no prazo), Realização (% realizadas do plano),
Replanejamento (% de planos com data reprogramada) e Cobertura de
Responsável (% de planos com `ResponsibleCode` atribuído).

- **Business grain:**
  uma linha por auditoria planejada (`AuditingPlanningCode`). A execução é
  trazida via `LEFT JOIN`, então auditorias planejadas ainda não realizadas
  aparecem com `ExecutedAt IS NULL`.
- **Filtros encapsulados (Opção B — CEO #18, corrigidos HOTFIX #41):**
  - `AuditingPlanning.AuditingPlanning_TupleExcluded = 0`
  - `Audit.Audit_TupleExcluded = 0` (na subquery de execução)
  - `Audit.Audit_Status = 2` (Realizada — confirmado por QA #31 com
    amostragem real; ver "Audit_Status enumeration" acima)
  - `NULLIF(campo, '1000-01-01')` em todos os campos de data (sentinel
    ERP legado — ver "Sentinel date convention" acima)
- **Parametrização:**
  filtros de janela (período, empresa, departamento) são aplicados pelo
  Backend via `WHERE` externo. Nenhuma data está hardcoded na view.

**Campos-chave (aliases expostos):**

| Field | Semantic type | Notes |
|---|---|---|
| `AuditingPlanningCode` | Key | Identificador do plano (grão da view). |
| `ContextCode` | Dimension | Contexto ERP do plano. |
| `CompanyCode` | Dimension | Empresa via `Context → Company`. |
| `CompanyCorporateName` | Dimension | Razão social da empresa. |
| `PlannedDate` | Date | Data originalmente planejada. `NULLIF(sentinel)` aplicado — `NULL` quando ERP armazena `1000-01-01`. |
| `ReplannedDate` | Date | Data reprogramada quando houve replanejamento. `NULLIF(sentinel)` aplicado. |
| `EffectiveDate` | Date | `COALESCE(ReplannedDate, PlannedDate)` pós-NULLIF — data efetivamente esperada. |
| `IsReplanned` | Flag (0/1) | `1` quando `ReplannedDate IS NOT NULL` (pós-NULLIF) e difere de `PlannedDate` — numerador do KPI Replanejamento. |
| `ExecutedAt` | Date | Data de **conclusão** (`Audit_EndDate`, não StartDate) da **primeira** execução finalizada (`Audit_Status = 2`, `Audit_TupleExcluded = 0`). `NULLIF(sentinel)` aplicado. Escolhida via `ROW_NUMBER()` ordenando por `Audit_EndDate ASC, Audit_Code ASC` para garantir par coerente com `AuditScore`. `NULL` quando o plano ainda não foi executado. |
| `AuditScore` | Metric | `Audit_Score` da **mesma linha** que definiu `ExecutedAt` (primeira execução). Escala assumida **0–100** (percentual, convenção VDA 6.3), pending DBA — ver "Escala de AuditScore" abaixo. Usado na segmentação de Etapa 4 do Funil (P7). `NULL` quando não há execução. |
| `ExecutedWithinTolerance` | Flag (0/1) | `1` quando `ExecutedAt <= EffectiveDate + 30 dias` — numerador do KPI Aderência. Tolerância de 30 dias alinhada ao MVP. |
| `DepartmentCode` | Dimension | Departamento do plano (drill-down). |
| `DepartmentDescription` | Dimension | Descrição do departamento. |
| `SectorDescription` | Dimension | Lista de setores concatenada (`GROUP_CONCAT` de `AuditingPlanningSector → Sector`) — evita fanout e preserva o grão. |
| `ResponsibleCode` | Key | Código do responsável atribuído ao plano; `NULL` quando ausente. |
| `ResponsibleAssigned` | Flag (0/1) | `1` quando `ResponsibleCode IS NOT NULL` — numerador do KPI Cobertura de Responsável. |
| `ResponsibleName` | Person | Primeiro nome do responsável (via `Person`). |
| `ResponsibleLastName` | Person | Sobrenome do responsável. |
| `TypeAuditCode` | Dimension | Código do tipo de auditoria (drill-down). |
| `TypeAuditDescription` | Dimension | Descrição do tipo de auditoria. |
| `AuditLevelCode` | Dimension | Código do nível da auditoria (drill-down). |
| `AuditLevelDescription` | Dimension | Descrição do nível da auditoria. |

**Design notes (desvios intencionais do SQL legado):**

- **Dedup de setor via subquery `GROUP_CONCAT`:** `auditorias_planejadas.sql`
  junta `AuditingPlanningSector` + `Sector` diretamente e causa fanout (várias
  linhas por `AuditingPlanningCode` quando há múltiplos setores). Aqui
  agregamos os setores em uma única string para preservar o grão "um plano por
  linha", indispensável para os denominadores dos KPIs. Para análises que
  exigem grão por setor (heatmap Setor × Tipo), use a view complementar
  `audits_kpi_base_by_sector`.
- **Primeira execução via `ROW_NUMBER()` (Fase C #35, HOTFIX #41):** a
  subquery `executed` ranqueia as execuções (`Audit_Status = 2`,
  `Audit_TupleExcluded = 0`, `NULLIF(Audit_EndDate, sentinel) IS NOT NULL`)
  do mesmo plano por `(Audit_EndDate ASC, Audit_Code ASC)` e mantém apenas
  `rn = 1`. Garante par coerente `(EndDate, Score)` da mesma linha de Audit.
- **`Audit_Status = 2` (corrigido HOTFIX #41):** QA #31 validou com dados
  reais que Status=2 é "Realizada" (208 linhas com EndDate real e vínculo
  a planning). Status=3 é "Em andamento/Avulsa" (0 vínculos a planning).
  A view legada `auditorias_realizadas.sql` usa `Status=3` e permanece
  intacta (decisão Opção B), mas **é incorreta para KPIs de aderência**.
- **NULLIF sentinel `1000-01-01` (HOTFIX #41):** o ERP usa esta data como
  sentinel em vez de NULL. 56% das ReplannedDate no banco real são sentinel.
  Sem NULLIF, IsReplanned e EffectiveDate ficam corrompidos.

**Correlações:**
- `auditorias-planejadas` (legacy): mesmo `AuditingPlanningCode`, mas aqui o
  grão é 1 linha/plano (sem fanout de setor) e o soft-delete já está aplicado.
- `auditorias-realizadas` (legacy): **atenção** — essa view legada filtra
  `Audit_Status = 3`, que QA #31 confirmou ser "Em andamento/Avulsa", **não**
  "Realizada". Para KPIs de aderência, `audits_kpi_base` usa `Status = 2`.
  Não juntar com essa view para cálculos de aderência.

**Typical business use:**
base única para cálculo server-side dos 4 KPIs de auditoria (Fase B) e
drill-down por empresa, departamento, setor, tipo e nível.

#### Escala de `AuditScore` (pré-requisito do P7 Funil — pending DBA)

**Assunção documentada:** `AuditScore` é um percentual em **0–100** (convenção
VDA 6.3). Bloqueante declarado pelo CEO para o P7 Funil (segmentação de
Etapa 4 por threshold 70).

**Evidência circunstancial (Medium certainty):**

| Evidência | Observação |
|---|---|
| Fixtures de teste | Backend e frontend usam `auditScore` com valores `62.0`, `79`, `85.5`, `88`, `88.5`, `90.0`, `91`, `91.0`, `92`. Todos ≤ 100, nenhum negativo, presença de decimais. |
| Campos companheiros | `Audit.Audit_TotalAuditAnsweScore` (soma dos scores de resposta), `Audit.Audit_TotalAnswers`, `Audit.Audit_TotalAnswerAvaliation`, `Audit.Audit_TotalFormCompleted`. Padrão típico de score normalizado em %. |
| Schema de respostas | `SmartFormSectionFields.SmartFormSectionFields_OptionsMaxValue` existe. Sugere `Audit_Score = sum(AuditAnswer_Score) / sum(OptionsMaxValue) × 100` ou equivalente normalizado. |
| Uso no frontend | `reportSemantics.ts` filtra `auditScore` com `v > 0` (trata 0 como ausência, não como pior score válido). |
| i18n | Label "Score médio" / "Avg. score" — apresentação coerente com métrica percentual. |
| Convenção setorial | VDA 6.3 e IATF 16949 normalizam resultado final em 0–100%. |

**Contra-evidência observada no repo:** nenhuma.

**Limites:** não foi possível inspecionar diretamente `MIN(Audit_Score)` e
`MAX(Audit_Score)` na base produtiva a partir deste ambiente. A assunção
permanece inferência — só o DBA pode confirmar definitivamente.

**Risco se escala ≠ 0–100:**
- Se `0–10`: threshold 70 classifica 100% das auditorias como "abaixo do alvo"
  → P7 vira ruído visual.
- Se `0–5`: idem, pior.
- Se score é raw (sem normalização): threshold 70 só funciona após
  renormalização server-side; P7 bloqueado até backend normalizar.

**Guarda recomendada (Backend, task #36):**

Ao servir o endpoint de KPIs, emitir log `WARNING` quando qualquer linha
retornar `AuditScore < 0` ou `AuditScore > 100`. Essa é a primeira evidência
acionável que invalidaria a assunção e deve disparar escalonamento imediato
ao CEO antes de habilitar o P7. Sugestão de implementação:

```python
suspicious = [r for r in rows
              if r.get("AuditScore") is not None
              and not 0 <= r["AuditScore"] <= 100]
if suspicious:
    logger.warning(
        "AuditScore fora da escala 0-100 (%d linhas) — "
        "possível mudança de escala; P7 bloqueado até revisão DBA.",
        len(suspicious),
    )
```

**Questão para DBA (a adicionar à lista de `Audit_Status`):**
- Confirmar `MIN(Audit_Score)` e `MAX(Audit_Score)` em linhas com
  `Audit_Status = 2` (Realizada, confirmado HOTFIX #41).
- Confirmar se `Audit_Score` é gravado já normalizado em % ou requer
  transformação a partir de `Audit_TotalAuditAnsweScore` + `OptionsMaxValue`.

### `audits_kpi_base_by_sector`

Source SQL: `database/views/mysql/audits_kpi_base_by_sector.sql`

Variante de `audits_kpi_base` com grão explodido por setor, dedicada ao
heatmap **Setor × Tipo de Auditoria** (P3 da Fase C) e a qualquer análise
que exija 1 linha por setor.

- **Business grain:**
  uma linha por (`AuditingPlanningCode` × `SectorCode`). Planos sem setores
  cadastrados aparecem uma única vez com `SectorCode` e `SectorDescription`
  nulos (LEFT JOIN). Planos com N setores aparecem em N linhas distintas.
- **Filtros encapsulados (iguais a `audits_kpi_base` — HOTFIX #41):**
  `AuditingPlanning_TupleExcluded = 0`, `Audit_TupleExcluded = 0`,
  `Audit_Status = 2`, `NULLIF(sentinel)` em campos de data. Todas as
  semânticas de `ExecutedAt`, `AuditScore`, `ExecutedWithinTolerance`,
  `IsReplanned` e `ResponsibleAssigned` são **idênticas** às de
  `audits_kpi_base`.
- **Parametrização:**
  filtros de janela (período, empresa, departamento, setor) aplicados pelo
  Backend via `WHERE` externo.

**Diferença vs `audits_kpi_base`:**

| Aspecto | `audits_kpi_base` | `audits_kpi_base_by_sector` |
|---|---|---|
| Grão | 1 linha por `AuditingPlanningCode` | 1 linha por (`AuditingPlanningCode` × `SectorCode`) |
| Setor | `SectorDescription` string `GROUP_CONCAT` | `SectorCode` + `SectorDescription` por linha |
| Uso recomendado | KPIs numéricos (denominadores = número de planos) | Heatmap e análises dimensionais por setor |
| Risco de double-count | Nenhum | **Alto se somar sem `DISTINCT AuditingPlanningCode`** |

**Campos expostos:** mesmos campos de `audits_kpi_base`, exceto que
`SectorDescription` deixa de ser concatenação e passa a ser **uma descrição
por linha**; adicionalmente expõe a coluna `SectorCode`
(= `AuditingPlanningSector.AuditingPlanningSector_Code`, FK para
`Sector.Sector_Code` no schema legado).

**Regra operacional crítica para consumidores:**
ao derivar contadores cujo denominador é "número de planos" (ex.: recontagem
de `ExecutedWithinTolerance`), aplicar `COUNT(DISTINCT AuditingPlanningCode)`.
Somar sem deduplicar inflaciona o resultado pela quantidade de setores de
cada plano.

**Manutenção:**
toda coluna ou semântica adicionada a `audits_kpi_base` deve ser propagada
aqui. O header de `audits_kpi_base.sql` é a fonte canônica de justificativas;
`audits_kpi_base_by_sector.sql` apenas substitui a estratégia de setor.

**Typical business use:**
heatmap Setor × Tipo (P3), drill-down por setor em KPIs executivos,
segmentações dimensionais que exigem linha-por-setor.

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
