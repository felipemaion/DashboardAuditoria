/*
 * audits_kpi_base_by_sector
 *
 * Propósito analítico
 *   Variante de audits_kpi_base com grão explodido por setor, dedicada ao
 *   heatmap Setor × Tipo de Auditoria (P3 da Fase C) e a qualquer análise
 *   que precise de 1 linha por (AuditingPlanningCode × SectorCode).
 *
 *   Planos sem setores cadastrados em AuditingPlanningSector aparecem uma
 *   única vez com SectorCode IS NULL e SectorDescription IS NULL (LEFT
 *   JOIN). Planos com N setores aparecem em N linhas distintas. Esse
 *   fanout é INTENCIONAL e controlado apenas nessa dimensão.
 *
 * Grão
 *   Uma linha por (AuditingPlanningCode × SectorCode).
 *   NÃO usar para denominadores dos KPIs numéricos — use audits_kpi_base
 *   para isso (grão "1 plano = 1 linha"). Aqui, agregações exigem DISTINCT
 *   por AuditingPlanningCode quando o denominador for "número de planos".
 *
 * Relação com audits_kpi_base
 *   Mesmos filtros, mesma semântica de ExecutedAt/AuditScore/
 *   ExecutedWithinTolerance/IsReplanned/ResponsibleAssigned. A única
 *   diferença estrutural é a substituição da subquery de GROUP_CONCAT
 *   por LEFT JOIN direto em AuditingPlanningSector + Sector, emitindo
 *   SectorCode + SectorDescription como colunas de linha.
 *
 *   Por que replicar em vez de usar audits_kpi_base como subquery:
 *   audits_kpi_base já agrega SectorDescription como GROUP_CONCAT; para
 *   reusá-la eu teria que SELECT coluna-a-coluna (excluindo a concatenada)
 *   e rejuntar AuditingPlanningSector — ou seja, praticamente duplicando
 *   o arquivo com menos legibilidade. Replicação deixa a única diferença
 *   estrutural óbvia em diff.
 *
 * MANUTENÇÃO
 *   Toda coluna/semântica adicionada a audits_kpi_base deve ser
 *   propagada aqui. O header de audits_kpi_base é a fonte canônica de
 *   justificativas; esse arquivo apenas substitui a estratégia de setor.
 *
 * Filtros encapsulados (iguais a audits_kpi_base — HOTFIX #41)
 *   - AuditingPlanning.AuditingPlanning_TupleExcluded = 0
 *   - Audit.Audit_TupleExcluded = 0
 *   - Audit.Audit_Status = 2 (Realizada — confirmado por QA #31)
 *   - NULLIF(data, '1000-01-01') em todos os campos de data (sentinel)
 *
 * Parametrização
 *   Filtros de janela (período, empresa, departamento, setor) aplicados
 *   pelo Backend via WHERE externo — não há data hardcoded aqui.
 *
 * Convenções
 *   snake_case no nome de arquivo; PascalCase nos aliases.
 */
SELECT
    ap.`AuditingPlanning_Code`                    AS `AuditingPlanningCode`,
    ap.`AuditingPlanning_ContextCode`             AS `ContextCode`,
    ctx.`Company_Code`                            AS `CompanyCode`,
    co.`Company_CorporateName`                    AS `CompanyCorporateName`,

    NULLIF(ap.`AuditingPlanning_PlannedDate`, '1000-01-01')
                                                  AS `PlannedDate`,
    NULLIF(ap.`AuditingPlanning_ReplannedDate`, '1000-01-01')
                                                  AS `ReplannedDate`,
    COALESCE(
        NULLIF(ap.`AuditingPlanning_ReplannedDate`, '1000-01-01'),
        NULLIF(ap.`AuditingPlanning_PlannedDate`,   '1000-01-01')
    )                                             AS `EffectiveDate`,
    CASE
        WHEN NULLIF(ap.`AuditingPlanning_ReplannedDate`, '1000-01-01') IS NOT NULL
         AND NULLIF(ap.`AuditingPlanning_ReplannedDate`, '1000-01-01')
              <> NULLIF(ap.`AuditingPlanning_PlannedDate`, '1000-01-01')
        THEN 1
        ELSE 0
    END                                           AS `IsReplanned`,

    executed.`ExecutedAt`                         AS `ExecutedAt`,
    executed.`AuditScore`                         AS `AuditScore`,
    CASE
        WHEN executed.`ExecutedAt` IS NOT NULL
         AND executed.`ExecutedAt` <= DATE_ADD(
             COALESCE(
                 NULLIF(ap.`AuditingPlanning_ReplannedDate`, '1000-01-01'),
                 NULLIF(ap.`AuditingPlanning_PlannedDate`,   '1000-01-01')
             ),
             INTERVAL 30 DAY
         )
        THEN 1
        ELSE 0
    END                                           AS `ExecutedWithinTolerance`,

    ap.`AuditingPlanning_DepartmentCode`          AS `DepartmentCode`,
    dept.`Department_Description`                 AS `DepartmentDescription`,

    /*
     * Setor explodido: única diferença estrutural vs audits_kpi_base.
     * aps.AuditingPlanningSector_Code é, no schema legado, o FK para
     * Sector.Sector_Code (ver database/views/mysql/auditorias_planejadas.sql).
     */
    aps.`AuditingPlanningSector_Code`             AS `SectorCode`,
    sec.`Sector_Description`                      AS `SectorDescription`,

    ap.`AuditingPlanning_ResponsiblePersonCode`   AS `ResponsibleCode`,
    CASE
        WHEN ap.`AuditingPlanning_ResponsiblePersonCode` IS NULL THEN 0
        ELSE 1
    END                                           AS `ResponsibleAssigned`,
    pers.`Person_Name`                            AS `ResponsibleName`,
    pers.`Person_LastName`                        AS `ResponsibleLastName`,

    ap.`AuditingPlanning_TypeAuditCode`           AS `TypeAuditCode`,
    ta.`TypeAudit_Description`                    AS `TypeAuditDescription`,
    ap.`AuditingPlanning_AuditLevelCode`          AS `AuditLevelCode`,
    al.`AuditLevel_Description`                   AS `AuditLevelDescription`
FROM `AuditingPlanning` ap
LEFT JOIN `Context`                ctx  ON ctx.`Context_Code`                = ap.`AuditingPlanning_ContextCode`
LEFT JOIN `Company`                co   ON co.`Company_Code`                 = ctx.`Company_Code`
LEFT JOIN `Department`             dept ON dept.`Department_Code`            = ap.`AuditingPlanning_DepartmentCode`
LEFT JOIN `Person`                 pers ON pers.`Person_Code`                = ap.`AuditingPlanning_ResponsiblePersonCode`
LEFT JOIN `TypeAudit`              ta   ON ta.`TypeAudit_Code`               = ap.`AuditingPlanning_TypeAuditCode`
LEFT JOIN `AuditLevel`             al   ON al.`AuditLevel_Code`              = ap.`AuditingPlanning_AuditLevelCode`

LEFT JOIN `AuditingPlanningSector` aps  ON aps.`AuditingPlanning_Code`       = ap.`AuditingPlanning_Code`
LEFT JOIN `Sector`                 sec  ON sec.`Sector_Code`                 = aps.`AuditingPlanningSector_Code`

/*
 * Execução realizada (HOTFIX #41): idêntico a audits_kpi_base.
 * Audit_Status = 2 (Realizada), Audit_EndDate (não StartDate),
 * NULLIF sentinel. Ver header de audits_kpi_base.sql.
 */
LEFT JOIN (
    SELECT ranked.`AuditingPlanningCode` AS `AuditingPlanningCode`,
           ranked.`ExecutedAt`           AS `ExecutedAt`,
           ranked.`AuditScore`           AS `AuditScore`
      FROM (
        SELECT au.`Audit_AuditingPlanningCode`  AS `AuditingPlanningCode`,
               NULLIF(au.`Audit_EndDate`, '1000-01-01')
                                                AS `ExecutedAt`,
               au.`Audit_Score`                 AS `AuditScore`,
               ROW_NUMBER() OVER (
                   PARTITION BY au.`Audit_AuditingPlanningCode`
                   ORDER BY NULLIF(au.`Audit_EndDate`, '1000-01-01') ASC,
                            au.`Audit_Code` ASC
               )                                AS `rn`
          FROM `Audit` au
         WHERE au.`Audit_Status`                = 2
           AND au.`Audit_TupleExcluded`         = 0
           AND au.`Audit_AuditingPlanningCode`  IS NOT NULL
           AND NULLIF(au.`Audit_EndDate`, '1000-01-01') IS NOT NULL
      ) ranked
     WHERE ranked.`rn` = 1
) executed
       ON executed.`AuditingPlanningCode` = ap.`AuditingPlanning_Code`

WHERE ap.`AuditingPlanning_TupleExcluded` = 0
