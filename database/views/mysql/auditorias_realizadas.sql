SELECT a.`Audit_Code` AS `AuditCode`,
       a.`Audit_ContextCode` AS `ContextCode`,
       t1.`Company_Code` AS `CompanyCode`,
       t2.`Company_CorporateName` AS `CompanyCorporateName`,
       a.`TypeAudit_Code` AS `TypeAuditCode`,
       t3.`TypeAudit_Description` AS `TypeAuditDescription`,
       a.`Audit_AuditorPersonCode` AS `AuditorCode`,
       t4.`Person_Name` AS `AuditorName`,
       t4.`Person_LastName` AS `AuditorLastName`,
       t4.`Person_DocumentType` AS `AuditorDocumentType`,
       t4.`Person_DocumentNumber` AS `AuditorDocumentNumber`,
       a.`Audit_ResponsiblePersonCode` AS `ResponsibleCode`,
       t5.`Person_Name` AS `ResponsibleName`,
       t5.`Person_LastName` AS `ResponsibleLastName`,
       t5.`Person_DocumentType` AS `ResponsibleDocumentType`,
       t5.`Person_DocumentNumber` AS `ResponsibleDocumentNumber`,
       a.`Audit_PlannedDate` AS `AuditPlannedDate`,
       a.`Audit_StartDate` AS `AuditStartDate`,
       a.`Audit_EndDate` AS `AuditEndDate`,
       a.`Audit_Status` AS `AuditStatus`,
       a.`Audit_UserModification` AS `AuditUserModification`,
       a.`Audit_TupleCreatedIn` AS `AuditTupleCreatedIn`,
       a.`Audit_TupleModifiedIn` AS `AuditTupleModifiedIn`,
       a.`Audit_TupleExcluded` AS `AuditTupleExcluded`,
       a.`Audit_Guid` AS `AuditGuid`,
       a.`Audit_DepartmentCode` AS `AuditDepartmentCodeCode`,
       t6.`Department_Description` AS `AuditDepartmentCodeDescription`,
       a.`Audit_SectorCode` AS `AuditSectorCodeCode`,
       t7.`Sector_Description` AS `AuditSectorCodeDescription`,
       a.`Audit_IndustrialMachineCode` AS `AuditIndustrialMachineCodeCode`,
       t8.`IndustrialMachine_Description` AS `AuditIndustrialMachineCodeDescription`,
       a.`Audit_AuditingPlanningCode` AS `AuditAuditingPlanningCodeCode`,
       t9.`AuditingPlanning_Code` AS `AuditAuditingPlanningCodeDescription`,
       a.`AuditLevel_Code` AS `AuditLevelCode`,
       t10.`AuditLevel_Description` AS `AuditLevelDescription`,
       a.`Audit_TotalAnswers` AS `AuditTotalAnswers`,
       a.`Audit_TotalAnswerAvaliation` AS `AuditTotalAnswerAvaliation`,
       a.`Audit_TotalFormCompleted` AS `AuditTotalFormCompleted`,
       a.`Audit_TotalAuditAnsweScore` AS `AuditTotalAuditAnsweScore`,
       a.`Audit_Score` AS `AuditScore`
FROM `Audit` a
LEFT JOIN `Context` t1 ON t1.`Context_Code` = a.`Audit_ContextCode`
LEFT JOIN `Company` t2 ON t2.`Company_Code` = t1.`Company_Code`
LEFT JOIN `TypeAudit` t3 ON t3.`TypeAudit_Code` = a.`TypeAudit_Code`
LEFT JOIN `Person` t4 ON t4.`Person_Code` = a.`Audit_AuditorPersonCode`
LEFT JOIN `Person` t5 ON t5.`Person_Code` = a.`Audit_ResponsiblePersonCode`
LEFT JOIN `Department` t6 ON t6.`Department_Code` = a.`Audit_DepartmentCode`
LEFT JOIN `Sector` t7 ON t7.`Sector_Code` = a.`Audit_SectorCode`
LEFT JOIN `IndustrialMachine` t8 ON t8.`IndustrialMachine_Code` = a.`Audit_IndustrialMachineCode`
LEFT JOIN `AuditingPlanning` t9 ON t9.`AuditingPlanning_Code` = a.`Audit_AuditingPlanningCode`
LEFT JOIN `AuditLevel` t10 ON t10.`AuditLevel_Code` = a.`AuditLevel_Code`
WHERE a.`Audit_Status`=3