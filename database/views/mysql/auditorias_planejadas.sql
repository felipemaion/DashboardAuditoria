SELECT a.`AuditingPlanning_Code` AS `AuditingPlanningCode`,
       a.`AuditingPlanning_ContextCode` AS `ContextCode`,
       t1.`Company_Code` AS `CompanyCode`,
       t2.`Company_CorporateName` AS `CompanyCorporateName`,
       a.`AuditingPlanning_PlannedDate` AS `AuditingPlanningPlannedDate`,
       a.`AuditingPlanning_ReplannedDate` AS `AuditingPlanningReplannedDate`,
       a.`AuditingPlanning_Frequency` AS `AuditingPlanningFrequency`,
       a.`AuditingPlanning_UserModification` AS `AuditingPlanningUserModification`,
       a.`AuditingPlanning_TupleCreatedIn` AS `AuditingPlanningTupleCreatedIn`,
       a.`AuditingPlanning_TupleModifiedIn` AS `AuditingPlanningTupleModifiedIn`,
       a.`AuditingPlanning_TupleExcluded` AS `AuditingPlanningTupleExcluded`,
       a.`AuditingPlanning_Guid` AS `AuditingPlanningGuid`,
       a.`AuditingPlanning_DepartmentCode` AS `AuditingPlanningDepartmentCodeCode`,
       t3.`Department_Description` AS `AuditingPlanningDepartmentCodeDescription`,
       a.`AuditingPlanning_ResponsiblePersonCode` AS `ResponsibleCode`,
       t4.`Person_Name` AS `ResponsibleName`,
       t4.`Person_LastName` AS `ResponsibleLastName`,
       t4.`Person_DocumentType` AS `ResponsibleDocumentType`,
       t4.`Person_DocumentNumber` AS `ResponsibleDocumentNumber`,
       a.`AuditingPlanning_TypeAuditCode` AS `AuditingPlanningTypeAuditCodeCode`,
       t5.`TypeAudit_Description` AS `AuditingPlanningTypeAuditCodeDescription`,
       a.`AuditingPlanning_AuditLevelCode` AS `AuditingPlanningAuditLevelCodeCode`,
       t6.`AuditLevel_Description` AS `AuditingPlanningAuditLevelCodeDescription`,
       t8.`Sector_Description`
FROM `AuditingPlanning` a
LEFT JOIN `Context` t1 ON t1.`Context_Code` = a.`AuditingPlanning_ContextCode`
LEFT JOIN `Company` t2 ON t2.`Company_Code` = t1.`Company_Code`
LEFT JOIN `Department` t3 ON t3.`Department_Code` = a.`AuditingPlanning_DepartmentCode`
LEFT JOIN `Person` t4 ON t4.`Person_Code` = a.`AuditingPlanning_ResponsiblePersonCode`
LEFT JOIN `TypeAudit` t5 ON t5.`TypeAudit_Code` = a.`AuditingPlanning_TypeAuditCode`
LEFT JOIN `AuditLevel` t6 ON t6.`AuditLevel_Code` = a.`AuditingPlanning_AuditLevelCode`
LEFT JOIN AuditingPlanningSector t7 ON t7.`AuditingPlanning_Code`= a.`AuditingPlanning_Code`
LEFT JOIN `Sector` t8 ON  t8.`Sector_Code` = t7.`AuditingPlanningSector_Code`
WHERE a.`AuditingPlanning_TupleExcluded` = 0
