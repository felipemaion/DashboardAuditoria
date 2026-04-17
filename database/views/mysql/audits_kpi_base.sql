/*
 * audits_kpi_base
 *
 * Propósito analítico
 *   View dedicada aos 4 KPIs executivos de auditoria (Fase B, MVP).
 *   Grão: uma linha por auditoria planejada (AuditingPlanningCode).
 *   LEFT JOIN com a primeira execução correspondente (Audit_Status = 2)
 *   — auditorias planejadas ainda não realizadas aparecem com
 *   ExecutedAt NULL.
 *
 * Filtros encapsulados (Opção B aprovada pelo CEO #18)
 *   - AuditingPlanning.AuditingPlanning_TupleExcluded = 0
 *   - Audit.Audit_TupleExcluded = 0
 *   - Audit.Audit_Status = 2 (Realizada — confirmado por QA #31 com
 *     amostragem real: Status=2 é o único com Audit_EndDate e
 *     Audit_AuditingPlanningCode preenchidos; Status=3 é "Em andamento/
 *     Avulsa" sem vínculo a planejamento; ver HOTFIX #41)
 *
 * Sentinelas de data (HOTFIX #41)
 *   O ERP legado usa '1000-01-01' como sentinel em campos de data
 *   (AuditingPlanning_PlannedDate, AuditingPlanning_ReplannedDate,
 *   Audit_EndDate) em vez de NULL. Todos os campos de data são
 *   envolvidos em NULLIF(campo, '1000-01-01') para normalizar.
 *
 * ExecutedAt = Audit_EndDate (HOTFIX #41)
 *   A tolerância de 30 dias mede se a auditoria foi CONCLUÍDA dentro
 *   do prazo, não quando começou. ExecutedAt vem de Audit_EndDate
 *   (com NULLIF sentinel), não Audit_StartDate.
 *
 * Débito técnico (Fase D, task #28)
 *   As views legadas auditorias_planejadas.sql e auditorias_realizadas.sql
 *   NÃO aplicam TupleExcluded = 0 e permanecem intactas por decisão Opção B.
 *   Consumidores daquelas views devem filtrar soft-delete do lado do
 *   consumidor até normalização.
 *
 * Parametrização
 *   Filtros de janela (período, empresa, departamento) são aplicados pelo
 *   Backend via WHERE externo — não há data hardcoded aqui.
 *
 * Semântica de AuditScore (Fase C, task #35)
 *   Exposto para segmentação de Etapa 4 do Funil (P7) por threshold VDA 6.3.
 *   Regra: score da PRIMEIRA execução do plano — mesma execução escolhida
 *   por MIN(Audit_EndDate) para ExecutedAt. Usamos ROW_NUMBER() na
 *   subquery executed para garantir que o par (EndDate, Score) venha da
 *   MESMA linha de Audit (mesmo Audit_Code), evitando qualquer risco de
 *   mistura que agregados escalares (MIN/MAX/AVG) introduziriam quando há
 *   re-execução. Desempate (EndDates iguais) via Audit_Code ASC.
 *   MAX/AVG foram rejeitados: MAX traria o melhor score entre execuções
 *   sucessivas (contradiz a semântica da primeira execução que define
 *   aderência); AVG mistura execuções e não tem interpretação de negócio.
 *
 * Escala de AuditScore (pre-requisito do P7 Funil — pending DBA)
 *   Assunção documentada: 0–100 (percentual, convenção VDA 6.3).
 *   Evidência circunstancial (Medium certainty):
 *     - Fixtures de teste backend/frontend usam valores decimais em 0–100
 *       (62.0, 79, 85.5, 88, 88.5, 90.0, 91, 91.0, 92); nenhum > 100.
 *     - Audit.Audit_Score coexiste com Audit_TotalAuditAnsweScore (soma),
 *       Audit_TotalAnswers, Audit_TotalAnswerAvaliation e
 *       Audit_TotalFormCompleted — padrão típico de score normalizado em %.
 *     - SmartFormSectionFields_OptionsMaxValue existe no schema, sugerindo
 *       normalização de sum(answer_score)/sum(max_value).
 *     - Frontend filtra auditScore com "v > 0" (0 tratado como ausência).
 *     - i18n label: "Score médio" / "Avg. score" (apresentação como %).
 *   Contra-evidência: nenhuma observada no repo.
 *   Não há inspeção direta do banco disponível neste ambiente; confirmar
 *   com DBA antes do GA. Guarda recomendada: Backend deve logar WARNING
 *   quando AuditScore retornar > 100 ou < 0 em qualquer linha — isso
 *   invalidaria a assunção e bloquearia o P7 até revisão.
 *
 * Convenções
 *   snake_case no nome de arquivo; PascalCase nos aliases, alinhado ao
 *   restante de database/views/mysql/.
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
    sectors.`SectorDescriptions`                  AS `SectorDescription`,

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
LEFT JOIN `Context`     ctx  ON ctx.`Context_Code`     = ap.`AuditingPlanning_ContextCode`
LEFT JOIN `Company`     co   ON co.`Company_Code`      = ctx.`Company_Code`
LEFT JOIN `Department`  dept ON dept.`Department_Code` = ap.`AuditingPlanning_DepartmentCode`
LEFT JOIN `Person`      pers ON pers.`Person_Code`     = ap.`AuditingPlanning_ResponsiblePersonCode`
LEFT JOIN `TypeAudit`   ta   ON ta.`TypeAudit_Code`    = ap.`AuditingPlanning_TypeAuditCode`
LEFT JOIN `AuditLevel`  al   ON al.`AuditLevel_Code`   = ap.`AuditingPlanning_AuditLevelCode`

/*
 * Setores: uma auditoria planejada pode estar associada a vários setores
 * via AuditingPlanningSector. Agregamos em lista para preservar o grão
 * "uma linha por AuditingPlanningCode" sem fanout.
 */
LEFT JOIN (
    SELECT aps.`AuditingPlanning_Code`            AS `AuditingPlanningCode`,
           GROUP_CONCAT(DISTINCT s.`Sector_Description`
                        ORDER BY s.`Sector_Description`
                        SEPARATOR ', ')           AS `SectorDescriptions`
      FROM `AuditingPlanningSector` aps
      JOIN `Sector` s
        ON s.`Sector_Code` = aps.`AuditingPlanningSector_Code`
     GROUP BY aps.`AuditingPlanning_Code`
) sectors
       ON sectors.`AuditingPlanningCode` = ap.`AuditingPlanning_Code`

/*
 * Execução realizada (HOTFIX #41): audit concluído (Audit_Status = 2,
 * confirmado por QA #31 — Status=3 é "Em andamento/Avulsa", sem vínculo
 * a planejamento). Se houver múltiplas execuções para o mesmo plano
 * (re-execução em sistemas legados), consideramos a PRIMEIRA (menor
 * Audit_EndDate, desempate por Audit_Code) — EndDate é a data de
 * conclusão, o marco correto para tolerância de 30 dias.
 *
 * NULLIF na EndDate: o sentinel '1000-01-01' aparece em campos de data
 * do ERP legado; linhas com sentinel são excluídas via
 * NULLIF(Audit_EndDate, '1000-01-01') IS NOT NULL no WHERE.
 *
 * ROW_NUMBER() garante par (EndDate, Score) coerente — ver header.
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
