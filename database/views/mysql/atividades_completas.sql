/* Formatted on 11/11/2025 08:11:34 (QP5 v5.336) */
SELECT a.Activity_Code
           AS ActivityCode,
       a.Activity_ContextCode
           AS ContextCode,
       t1.Company_Code
           AS CompanyCode,
       t2.Company_CorporateName
           AS CompanyCorporateName,
       a.Activity_ParentCode
           AS ActivityParentCodeCode,
       t3.Activity_Code
           AS ActivityParentCodeDescription,
       regexp_replace(a.Activity_Detail,'<[^>]*>','')
           AS ActivityDetail,
       a.Activity_UserModification
           AS ActivityUserModification,
       a.Activity_TupleCreatedIn
           AS ActivityTupleCreatedIn,
       a.Activity_TupleModifiedIn
           AS ActivityTupleModifiedIn,
       a.Activity_TupleExcluded
           AS ActivityTupleExcluded,
       a.Activity_Guid
           AS ActivityGuid,
       a.Activity_DescriptionForRelease
           AS ActivityDescriptionForRelease,
       a.Activity_DetailForRelease
           AS ActivityDetailForRelease,
       a.Activity_Priority
           AS ActivityPriority,
       a.Activity_Complexity
           AS ActivityComplexity,
       a.Activity_Outsourced
           AS ActivityOutsourced,
       a.Activity_EstimatedTimeExecution
           AS ActivityEstimatedTimeExecution,
       a.Activity_EstimatedTimeReview
           AS ActivityEstimatedTimeReview,
       a.Activity_EstimatedTimeTesting
           AS ActivityEstimatedTimeTesting,
       a.Activity_Deadline
           AS ActivityDeadline,
       a.Activity_ProjectCode
           AS ActivityProjectCodeCode,
       t4.Project_Name
           AS ActivityProjectCodeDescription,
       a.Activity_EpicCode
           AS ActivityEpicCodeCode,
       t5.Epic_Description
           AS ActivityEpicCodeDescription,
       a.Activity_IssueCode
           AS ActivityIssueCodeCode,
       t6.Issue_Description
           AS ActivityIssueCodeDescription,
       a.Activity_StartTime
           AS ActivityStartTime,
       a.Activity_EndTime
           AS ActivityEndTime,
       a.Activity_IsOnline
           AS ActivityIsOnline,
       a.Activity_Link
           AS ActivityLink,
       a.Activity_Script
           AS ActivityScript,
       a.Schedule_Code
           AS ScheduleCode,
       t7.Schedule_Description
           AS ScheduleDescription,
       a.Activity_Level
           AS ActivityLevel,
       a.Activity_PlannedDate
           AS ActivityPlannedDate,
       a.Activity_ReplannedDate
           AS ActivityReplannedDate,
       a.Activity_Filed
           AS ActivityFiled,
       a.Activity_RequiresAttachment
           AS ActivityRequiresAttachment,
       a.Activity_Title
           AS ActivityTitle,
       regexp_replace(a.Activity_Problem,'<[^>]*>','')
           AS ActivityProblem,
       a.Activity_ImplementedDate
           AS ActivityImplementedDate,
       regexp_replace(a.Activity_CorrectiveAction,'<[^>]*>','')
           AS ActivityCorrectiveAction,
       a.Activity_CancellationDate
           AS ActivityCancellationDate,
       a.Activity_ReasonCancellation
           AS ActivityReasonCancellation,
       a.Activity_FocusFactoryCode
           AS ActivityFocusFactoryCodeCode,
       t8.FocusFactory_Description
           AS ActivityFocusFactoryCodeDescription,
       a.Activity_ReasonRefusal
           AS ActivityReasonRefusal,
       a.Activity_ReasonDate
           AS ActivityReasonDate,
       a.Activity_ActivityClosed
           AS ActivityActivityClosed,
       a.Activity_ActionPlanCode
           AS ActivityActionPlanCodeCode,
       t9.ActionPlan_Description
           AS ActivityActionPlanCodeDescription,
       a.Activity_IsModel
           AS ActivityIsModel,
       a.Activity_CompletionLevel
           AS ActivityCompletionLevel,
       a.ActivitySection_Code
           AS ActivitySectionCode,
       t10.ActivitySection_Description
           AS ActivitySectionDescription,
       a.Activity_OccurrenceCode
           AS ActivityOccurrenceCodeCode,
       t11.Occurrence_Description
           AS ActivityOccurrenceCodeDescription,
       a.Activity_OccurrenceCausesCode
           AS ActivityOccurrenceCausesCodeCode,
       t12.OccurrenceCauses_Code
           AS ActivityOccurrenceCausesCodeDescription,
       a.Activity_Private
           AS ActivityPrivate,
       a.Activity_ActivityArchived
           AS ActivityActivityArchived,
       a.Activity_ActivityFailed
           AS ActivityActivityFailed,
       a.Activity_ActivityDateClosed
           AS ActivityActivityDateClosed,
       a.Activity_SectorCode
           AS ActivitySectorCodeCode,
       t13.Sector_Description
           AS ActivitySectorCodeDescription,
       a.Activity_AuditAnswerCode
           AS ActivityAuditAnswerCode,
       a.Activity_CorporateDivisionCode
           AS ActivityCorporateDivisionCodeCode,
       t14.CorporateDivision_Description
           AS ActivityCorporateDivisionCodeDescription,
       a.FrequencyIndicator_Code
           AS FrequencyIndicatorCode,
       t15.FrequencyIndicator_Description
           AS FrequencyIndicatorDescription,
       a.Activity_Objective
           AS ActivityObjective,
       a.Activity_FunctionalRequirements
           AS ActivityFunctionalRequirements,
       a.Activity_BusinessRule
           AS ActivityBusinessRule,
       a.Activity_AcceptanceCriteria
           AS ActivityAcceptanceCriteria,
       a.Activity_Order
           AS ActivityOrder,
       a.Activity_OrderTo
           AS ActivityOrderTo,
       a.Activity_LastDateOrderUpdate
           AS ActivityLastDateOrderUpdate,
       a.Activity_AttendanceAnswerCode
           AS ActivityAttendanceAnswerCode,
       a.Attendance_Code
           AS AttendanceCode,
       t16.Attendance_Code
           AS AttendanceDescription,
       a.TypeActivity_Code
           AS TypeActivityCode,
       t17.TypeActivity_Description
           AS TypeActivityDescription,
       a.Activity_OccurrenceAnswerCode
           AS ActivityOccurrenceAnswerCode,
       a.Release_Code
           AS ReleaseCode,
       t18.Release_Description
           AS ReleaseDescription,
       a.Release_Code
           AS ReleaseCode,
       t19.Release_Description
           AS ReleaseDescription,
       a.Activity_DegreeRefusal
           AS ActivityDegreeRefusal,
       a.Activity_Stack
           AS ActivityStack,
      aws.ActivityWorkflowStages_WorkflowStagesCode AS MainWorkflowStagesCode,
       w.WorkflowStages_Description AS MainWorkflowStagesDescription,     
       a.Activity_DevelopmentForecast
           AS ActivityDevelopmentForecast,
       UPPER(IFNULL(OccurrenceStatus.OccurrenceStatus_Description, 'Em andamento')) AS Status_occurrence,  
  Indicator,
  CONCAT(pr_req.Person_Name,' ',pr_req.Person_LastName) AS RequesterPersonName,    
CONCAT(pr.Person_Name,' ',pr.Person_LastName) AS ResponsiblePersonName
--  CONCAT('activities/edit?activity=', a.Activity_Guid, '&workflowStagesCode=', aws.ActivityWorkflowStages_WorkflowStagesCode, '&workflowGuid=', ww.Workflow_Guid) AS link,    
  FROM Dealer_Magna.Activity  a
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
       LEFT JOIN Dealer_Magna.Release t19
           ON t19.Release_Code = a.Release_Code
        LEFT JOIN (
  SELECT 
    Activity_Code AS indicator_Activ_code,
    GROUP_CONCAT(DISTINCT CONCAT(ActivityIndicator.ActivityIndicator_Code,'-', regexp_replace(Indicator.Indicator_Description, '<[^>]*>', '')) SEPARATOR ',') AS Indicator 
  FROM ActivityIndicator
  JOIN Indicator ON Indicator.Indicator_Code = ActivityIndicator.Indicator_Code
  WHERE ActivityIndicator_TupleExcluded = 0
  GROUP BY Activity_Code
) Acd ON Acd.indicator_Activ_code = a.Activity_Code  
LEFT JOIN ActivityWorkflowStages aws 
       ON aws.ActivityWorkflowStages_ActivityCode = a.Activity_Code 
      AND aws.ActivityWorkflowStages_TupleExcluded = 0
LEFT JOIN WorkflowStages w 
       ON w.WorkflowStages_Code = aws.ActivityWorkflowStages_WorkflowStagesCode
LEFT JOIN Workflow ww 
       ON ww.Workflow_Code = w.Workflow_Code 
LEFT JOIN OccurrenceStatus ON OccurrenceStatus.OccurrenceStatus_Code = t11.Occurrence_OccurrenceStatusCode       
LEFT JOIN TypeIncident ON TypeIncident.TypeIncident_Code = t11.TypeIncident_Code
LEFT JOIN Person pr ON aws.`ActivityWorkflowStages_ResponsiblePersonCode`  = pr.Person_Code
LEFT JOIN Person pr_req ON aws.`ActivityWorkflowStages_RequesterPersonCode` = pr_req.Person_Code
WHERE a.Activity_Outsourced = FALSE
  AND a.Activity_TupleExcluded = 0