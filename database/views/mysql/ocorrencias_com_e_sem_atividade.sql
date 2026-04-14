SELECT
    /* =====================================================
       CHAVE
       ===================================================== */
    a.Activity_Code AS codigo_atividade,

    /* =====================================================
       OCORRÊNCIA
       ===================================================== */
    o.Occurrence_Code AS codigo_ocorrencia,
    o.Occurrence_ContextCode AS contexto_ocorrencia,
    o.Occurrence_OriginContextCode AS contexto_origem_ocorrencia,
    o.Occurrence_DepartmentCode AS departamento_ocorrencia,
    o.ModuleDesk_Code AS modulo_ocorrencia,

    o.Occurrence_Description AS descricao_ocorrencia,
    o.Occurrence_Detail AS justificativa_ocorrencia,
    o.Occurrence_Priority AS prioridade_ocorrencia,
    o.Occurrence_UserModification AS usuario_modificacao_ocorrencia,
    o.Occurrence_TupleCreatedIn AS data_abertura_ocorrencia,
    o.Occurrence_TupleModifiedIn AS data_atualizacao_ocorrencia,
    o.Occurrence_Guid AS guid_ocorrencia,

    o.Occurrence_RequesterPersonCode AS codigo_solicitante,
    o.Occurrence_RequesterPersonContactCode AS contato_solicitante,
    o.Occurrence_ResponsiblePersonCode AS codigo_responsavel_ocorrencia,

    /* =======================
       SOLICITANTE (DETALHADO)
       ======================= */
    ps.Person_Name AS nome_solicitante,
    ps.Person_LastName AS sobrenome_solicitante,

    /* =======================
       RESPONSÁVEL (DETALHADO)
       ======================= */
    pr.Person_Name AS nome_responsavel_ocorrencia,
    pr.Person_LastName AS sobrenome_responsavel_ocorrencia,

    /* =====================================================
       MÁQUINA INDUSTRIAL (MODELO CORRETO)
       ===================================================== */
    oim.OccurrenceIndustrialMachine_IndustrialMachineCode AS codigo_maquina_industrial,
    im.IndustrialMachine_Description AS maquina_industrial,
    Shift.`Shift_Description` Shift, 

    /* =====================================================
       CONTEXTO / EMPRESA
       ===================================================== */
    a.Activity_ContextCode AS contexto_atividade,
    t1.Company_Code AS codigo_empresa,
    t2.Company_CorporateName AS nome_empresa,

    /* =====================================================
       ATIVIDADE (CONSULTA 1 INTACTA)
       ===================================================== */
    a.Activity_ParentCode AS codigo_atividade_pai,
    t3.Activity_Code AS descricao_atividade_pai,

    REGEXP_REPLACE(a.Activity_Detail,'<[^>]*>','') AS detalhe_atividade,
    a.Activity_UserModification AS usuario_modificacao_atividade,
    a.Activity_TupleCreatedIn AS data_criacao_atividade,
    a.Activity_TupleModifiedIn AS data_atualizacao_atividade,
    a.Activity_TupleExcluded AS atividade_excluida,
    a.Activity_Guid AS guid_atividade,

    a.Activity_DescriptionForRelease AS descricao_para_release,
    a.Activity_DetailForRelease AS detalhe_para_release,
    a.Activity_Priority AS prioridade_atividade,
    a.Activity_Complexity AS complexidade_atividade,
    a.Activity_Outsourced AS terceirizada,

    a.Activity_EstimatedTimeExecution AS tempo_estimado_execucao,
    a.Activity_EstimatedTimeReview AS tempo_estimado_revisao,
    a.Activity_EstimatedTimeTesting AS tempo_estimado_teste,

    a.Activity_Deadline AS prazo_atividade,
    a.Activity_ProjectCode AS codigo_projeto,
    t4.Project_Name AS nome_projeto,

    a.Activity_EpicCode AS codigo_epico,
    t5.Epic_Description AS descricao_epico,

    a.Activity_IssueCode AS codigo_issue,
    t6.Issue_Description AS descricao_issue,

    a.Activity_StartTime AS hora_inicio,
    a.Activity_EndTime AS hora_fim,
    a.Activity_IsOnline AS atividade_online,
    a.Activity_Link AS link_atividade,
    a.Activity_Script AS script_atividade,

    a.Schedule_Code AS codigo_agenda,
    t7.Schedule_Description AS descricao_agenda,

    a.Activity_Level AS nivel_atividade,
    a.Activity_PlannedDate AS data_planejada,
    a.Activity_ReplannedDate AS data_replanejada,
    a.Activity_Filed AS arquivada,
    a.Activity_RequiresAttachment AS requer_anexo,
    a.Activity_Title AS titulo_atividade,

    REGEXP_REPLACE(a.Activity_Problem,'<[^>]*>','') AS problema_atividade,
    a.Activity_ImplementedDate AS data_implementacao,
    REGEXP_REPLACE(a.Activity_CorrectiveAction,'<[^>]*>','') AS acao_corretiva,

    a.Activity_CancellationDate AS data_cancelamento,
    a.Activity_ReasonCancellation AS motivo_cancelamento_atividade,

    a.Activity_FocusFactoryCode AS codigo_fabrica_foco,
    t8.FocusFactory_Description AS fabrica_foco,

    a.Activity_ReasonRefusal AS motivo_recusa,
    a.Activity_ReasonDate AS data_recusa,
    a.Activity_ActivityClosed AS atividade_fechada,

    a.Activity_ActionPlanCode AS codigo_plano_acao,
    t9.ActionPlan_Description AS descricao_plano_acao,

    a.Activity_IsModel AS atividade_modelo,
    a.Activity_CompletionLevel AS nivel_conclusao,

    a.ActivitySection_Code AS codigo_secao_atividade,
    t10.ActivitySection_Description AS secao_atividade,

    a.Activity_OccurrenceCode AS codigo_ocorrencia_atividade,
    t11.Occurrence_Description AS descricao_ocorrencia_atividade,

    a.Activity_OccurrenceCausesCode AS codigo_causa_ocorrencia,
    t12.OccurrenceCauses_Code AS causa_ocorrencia,

    a.Activity_Private AS atividade_privada,
    a.Activity_ActivityArchived AS atividade_arquivada,
    a.Activity_ActivityFailed AS atividade_falhou,
    a.Activity_ActivityDateClosed AS data_fechamento_atividade,

    a.Activity_SectorCode AS codigo_setor,
    t13.Sector_Description AS setor,

    a.Activity_AuditAnswerCode AS resposta_auditoria,

    a.Activity_CorporateDivisionCode AS codigo_divisao,
    t14.CorporateDivision_Description AS divisao_corporativa,

    a.FrequencyIndicator_Code AS codigo_indicador_frequencia,
    t15.FrequencyIndicator_Description AS indicador_frequencia,

    a.Activity_Objective AS objetivo,
    a.Activity_FunctionalRequirements AS requisitos_funcionais,
    a.Activity_BusinessRule AS regra_negocio,
    a.Activity_AcceptanceCriteria AS criterios_aceite,

    a.Activity_Order AS ordem,
    a.Activity_OrderTo AS ordem_ate,
    a.Activity_LastDateOrderUpdate AS data_ultima_atualizacao_ordem,

    a.Activity_AttendanceAnswerCode AS resposta_atendimento,
    a.Attendance_Code AS codigo_responsavel_atividade,

    a.TypeActivity_Code AS codigo_tipo_atividade,
    t17.TypeActivity_Description AS tipo_atividade,

    a.Activity_OccurrenceAnswerCode AS resposta_ocorrencia,
    a.Release_Code AS codigo_release,
    t18.Release_Description AS descricao_release,

    a.Activity_DegreeRefusal AS grau_recusa,
    a.Activity_Stack AS stack,
    a.Activity_DevelopmentForecast AS previsao_desenvolvimento,
    a.Activity_Amount AS quantidade,

    /* =====================================================
       WORKFLOW / STATUS
       ===================================================== */
    aws.ActivityWorkflowStages_WorkflowStagesCode AS codigo_etapa_workflow,
    w.WorkflowStages_Description AS etapa_workflow,

    UPPER(
        IFNULL(OccurrenceStatus.OccurrenceStatus_Description,'EM ANDAMENTO')
    ) AS status_ocorrencia,

    /* =====================================================
       INDICADORES (ATIVIDADE)
       ===================================================== */
    Acd.Indicator AS indicadores,

    /* =====================================================
       INDICADORES DA OCORRÊNCIA
       ===================================================== */
    fi_occ.FrequencyIndicator_Description AS frequencia_indicador_ocorrencia,
    REGEXP_REPLACE(ind_occ.Indicator_Description,'<[^>]*>','') AS indicador_ocorrencia,
    oi.OccurrenceIndicator_Main AS principal_indicador_ocorrencia,
    oir.Reasons AS motivos_indicador_ocorrencia

FROM  Dealer_Magna.Occurrence o

LEFT JOIN Dealer_Magna.Activity a
       ON o.Occurrence_Code = a.Activity_OccurrenceCode
      AND o.Occurrence_TupleExcluded = 0

LEFT JOIN Dealer_Magna.Person ps
       ON ps.Person_Code = o.Occurrence_RequesterPersonCode
LEFT JOIN Dealer_Magna.Person pr
       ON pr.Person_Code = o.Occurrence_ResponsiblePersonCode

LEFT JOIN Dealer_Magna.OccurrenceIndustrialMachine oim
       ON oim.Occurrence_Code = o.Occurrence_Code
      AND oim.OccurrenceIndustrialMachine_TupleExcluded = 0
LEFT JOIN Dealer_Magna.IndustrialMachine im
       ON im.IndustrialMachine_Code =
          o.IndustrialMachine_Code

LEFT JOIN Dealer_Magna.Context t1
       ON t1.Context_Code = a.Activity_ContextCode
LEFT JOIN Dealer_Magna.Company t2
       ON t2.Company_Code = t1.Company_Code
LEFT JOIN Dealer_Magna.Activity t3
       ON t3.Activity_Code = a.Activity_ParentCode
LEFT JOIN Dealer_Magna.Project t4
       ON t4.Project_Code = a.Activity_ProjectCode
LEFT JOIN Dealer_Magna.Epic t5
       ON t5.Epic_Code = a.Activity_EpicCode
LEFT JOIN Dealer_Magna.Issue t6
       ON t6.Issue_Code = a.Activity_IssueCode
LEFT JOIN Dealer_Magna.Schedule t7
       ON t7.Schedule_Code = a.Schedule_Code
LEFT JOIN Dealer_Magna.FocusFactory t8
       ON t8.FocusFactory_Code = a.Activity_FocusFactoryCode
LEFT JOIN Dealer_Magna.ActionPlan t9
       ON t9.ActionPlan_Code = a.Activity_ActionPlanCode
LEFT JOIN Dealer_Magna.ActivitySection t10
       ON t10.ActivitySection_Code = a.ActivitySection_Code
LEFT JOIN Dealer_Magna.Occurrence t11
       ON t11.Occurrence_Code = a.Activity_OccurrenceCode
LEFT JOIN Dealer_Magna.OccurrenceCauses t12
       ON t12.OccurrenceCauses_Code = a.Activity_OccurrenceCausesCode
LEFT JOIN Dealer_Magna.Sector t13
       ON t13.Sector_Code = a.Activity_SectorCode
LEFT JOIN Dealer_Magna.CorporateDivision t14
       ON t14.CorporateDivision_Code = a.Activity_CorporateDivisionCode
LEFT JOIN Dealer_Magna.FrequencyIndicator t15
       ON t15.FrequencyIndicator_Code = a.FrequencyIndicator_Code
LEFT JOIN Dealer_Magna.Attendance t16
       ON t16.Attendance_Code = a.Attendance_Code
LEFT JOIN Dealer_Magna.TypeActivity t17
       ON t17.TypeActivity_Code = a.TypeActivity_Code
LEFT JOIN Dealer_Magna.Release t18
       ON t18.Release_Code = a.Release_Code
LEFT JOIN Dealer_Magna.Shift Shift ON Shift.`Shift_Code` = o.Shift_Code       

LEFT JOIN (
    SELECT
        Activity_Code,
        GROUP_CONCAT(
            DISTINCT CONCAT(
                ActivityIndicator.ActivityIndicator_Code,'-',
                REGEXP_REPLACE(Indicator.Indicator_Description,'<[^>]*>','')
            ) SEPARATOR ','
        ) AS Indicator
    FROM Dealer_Magna.ActivityIndicator
    JOIN Dealer_Magna.Indicator
      ON Indicator.Indicator_Code = ActivityIndicator.Indicator_Code
    WHERE ActivityIndicator_TupleExcluded = 0
    GROUP BY Activity_Code
) Acd
ON Acd.Activity_Code = a.Activity_Code

LEFT JOIN Dealer_Magna.ActivityWorkflowStages aws
       ON aws.ActivityWorkflowStages_ActivityCode = a.Activity_Code
      AND aws.ActivityWorkflowStages_TupleExcluded = 0
LEFT JOIN Dealer_Magna.WorkflowStages w
       ON w.WorkflowStages_Code = aws.ActivityWorkflowStages_WorkflowStagesCode
LEFT JOIN Dealer_Magna.OccurrenceStatus
       ON OccurrenceStatus.OccurrenceStatus_Code = o.Occurrence_OccurrenceStatusCode

/* =====================================================
   INDICADORES DA OCORRÊNCIA (JOINs)
   ===================================================== */
LEFT JOIN Dealer_Magna.OccurrenceIndicator oi
       ON oi.Occurrence_Code = o.Occurrence_Code

LEFT JOIN Dealer_Magna.FrequencyIndicator fi_occ
       ON fi_occ.FrequencyIndicator_Code = oi.OccurrenceIndicator_FrequencyCode

LEFT JOIN Dealer_Magna.Indicator ind_occ
       ON ind_occ.Indicator_Code = oi.Indicator_Code

LEFT JOIN (
    SELECT
        oir.OccurrenceIndicator_Code,
        GROUP_CONCAT(
            DISTINCT REGEXP_REPLACE(ir.IndicatorReason_Description,'<[^>]*>','')
            SEPARATOR ','
        ) AS Reasons
    FROM Dealer_Magna.OccurrenceIndicatorReasons oir
    JOIN Dealer_Magna.IndicatorReason ir
      ON ir.IndicatorReason_Code = oir.IndicatorReason_Code
    GROUP BY oir.OccurrenceIndicator_Code
) oir
       ON oir.OccurrenceIndicator_Code = oi.OccurrenceIndicator_Code

WHERE
    ( a.Activity_Outsourced = 0 OR a.Activity_Outsourced IS NULL)
    AND ( a.Activity_TupleExcluded = 0 OR  a.Activity_TupleExcluded IS NULL );
