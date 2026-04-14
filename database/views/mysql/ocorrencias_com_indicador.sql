SELECT 
  `Occurrence`.`Occurrence_Code` AS `Issue #`,
  `Occurrence`.`Occurrence_Code` AS `Issue`,
  `Occurrence`.`Occurrence_Date` AS `Issue Date`,
  `Product`.`Product_SKU` AS `Part #`,
  `Relacionamento_Cliente`.`CustomerRelationship_Description` AS `Customer Plant`,
  `CustomerClass`.`CustomerClass_Description` AS `Customer Class`,
  `ProductFamily`.`ProductFamily_Description` AS `Product Family`,
  `Project`.`Project_Name` AS `Project`,
  `Occurrence`.`Occurrence_Description` AS `Defect`,
  (
    CASE
      WHEN (
        `Occurrence`.`Occurrence_Side` = 1
      ) 
      THEN 'RH' 
      WHEN (
        `Occurrence`.`Occurrence_Side` = 2
      ) 
      THEN 'LH' 
      WHEN (
        `Occurrence`.`Occurrence_Side` = 3
      ) 
      THEN 'Both' 
      ELSE 'N/A' 
    END
  ) AS `Side`,
  `WhoDetected`.`WhoDetected_Description` AS `Who Detected?`,
  `WhereDetected`.`WhereDetected_Description` AS `Where detected?`,
  `Occurrence`.`Occurrence_ProductionDate` AS `Production Date`,
  `Shift`.`Shift_Description` AS `Shift`,
  (
    CASE
      WHEN (
        `Occurrence`.`Occurrence_Recurrent` = 1
      ) 
      THEN 'Yes' 
      ELSE 'No' 
    END
  ) AS `Repeats?`,
  (
    CASE
      WHEN (
        `Occurrence`.`Occurrence_Launch` = 1
      ) 
      THEN 'Yes' 
      ELSE 'No' 
    END
  ) AS `Safe Launch?`,
  `Occurrence`.`Occurrence_DocumentCustomer` AS `Customer Doc.`,
  IFNULL(`COSTs`.`Costs`, 0) AS `Cost Customer document`,
  `Occurrence`.`Occurrence_Code` AS `PPSR #`,
  IFNULL(`COSTs`.`Costs`, 0) AS `Costs origin from failure`,
  `TypeIncident`.`TypeIncident_Description` AS `Incidents Type`,
  `TypeOccurrence`.`TypeOccurrence_Description` AS `Type Occurrence`,
  `OccurrenceClass`.`OccurrenceClass_Description` AS `Class`,
  `LaunchSeries`.`LaunchSeries_Description` AS `Launch or Serie?`,
  `OccurrenceSituation`.`OccurrenceSituation_Description` AS `Status`,
  `MajorEvent`.`MajorEvent_Description` AS `Major Event?`,
  `WhoCausedDefect`.`WhoCausedDefect_Description` AS `Who caused the defect?`,
  `IM`.`IndustrialMachine_Description` AS `Machine / Station resp.`,
  '' AS `Injection`,
  `FocusFactory`.`FocusFactory_Description` AS `Focus Factory`,
  `Risk`.`Risk_Description` AS `Risk`,
  `Effort`.`Effort_Description` AS `Effort`,
  '' AS `Occurrence`,
  `Occurrence`.`Occurrence_Priority` AS `Priority`,
  '' AS `Interim Corrective Action`,
  `Escalation`.`Escalation_Description` AS `Escalation`,
  `ICA`.`Activity_PlannedDate_ICA` AS `ICA Date Planned`,
  `ICA`.`mAX_ImplementedDate_ICA` AS `ICA Date Implemented`,
  `occ`.`OccurrenceCauses_Detail` AS `Root Cause(s)`,
  `PCA`.`Activity_Title_pca` AS `Permanent Corrective Action (PCA)`,
  `PCA`.`Activity_PlannedDate_PCA` AS `PCA Date Planned`,
  `PCA`.`mAX_ImplementedDate_PCA` AS `PCA Date Implemented`,
  `Responsavel`.`Person_Name` AS `Champion`,
  `RootCauseLinkage`.`RootCauseLinkage_Description` AS `Root cause Linkage`,
  `MQS`.`MQS_Description` AS `MQS Binning`,  
  '' AS `Comments`,
  `Company`.`Company_FantasyName` AS `Company`,
  SUBSTR(
    `Company`.`Company_CorporateName`,
    1,
    3
  ) AS `CorporateName`,
  CONCAT(
    TRIM(`Occurrence`.`Occurrence_Guid`),
    '/edit'
  ) AS `Link`,
  CONCAT(
    'Occurrences/',
    TRIM(`Occurrence`.`Occurrence_Code`),
    '/activities'
  ) AS `Link_actv`,
  `oa`.`Activity_open` AS `Activity_open`,
  `oa`.`Activity_delay` AS `Activity_delay`,
  `Disposition`.`Disposition_Description` AS `Disposition`,
  `Occurrence`.`Occurrence_Result` AS `Result`,
  UPPER(
    IFNULL(
      `OccurrenceStatus`.`OccurrenceStatus_Description`,
      'Em andamento'
    )
  ) AS `Status_Occurrence`,
  Indicator,
   Occurrence.`Occurrence_Amount` Qty_Founded
FROM
  (
    (
      (
        (
          (
            (
              (
                (
                  (
                    (
                      (
                        (
                          (
                            (
                              (
                                (
                                  (
                                    (
                                      (
                                        (
                                          (
                                            (
                                              (
                                                (
                                                  (
                                                    (
                                                      (
                                                        (
                                                          (
                                                            (
                                                              (
                                                                (
                                                                  (
                                                                    (
                                                                      (
                                                                        (
                                                                          (
                                                                            (
                                                                              (
                                                                                (
                                                                                  (
                                                                                    (
                                                                                      (
                                                                                        (
                                                                                          `Occurrence` 
                                                                                          LEFT JOIN `WhoDetected` 
                                                                                            ON (
                                                                                              (
                                                                                                `WhoDetected`.`WhoDetected_Code` = `Occurrence`.`WhoDetected_Code`
                                                                                              )
                                                                                            )
                                                                                        ) 
                                                                                        LEFT JOIN `ModeContact` 
                                                                                          ON (
                                                                                            (
                                                                                              `ModeContact`.`ModeContact_Code` = `Occurrence`.`ModeContact_Code`
                                                                                            )
                                                                                          )
                                                                                      ) 
                                                                                      LEFT JOIN `WhereDetected` 
                                                                                        ON (
                                                                                          (
                                                                                            `WhereDetected`.`WhereDetected_Code` = `Occurrence`.`WhereDetected_Code`
                                                                                          )
                                                                                        )
                                                                                    ) 
                                                                                    LEFT JOIN `Shift` 
                                                                                      ON (
                                                                                        (
                                                                                          `Shift`.`Shift_Code` = `Occurrence`.`Shift_Code`
                                                                                        )
                                                                                      )
                                                                                  ) 
                                                                                  LEFT JOIN `IndustrialMachine` `IM` 
                                                                                    ON (
                                                                                      (
                                                                                        `IM`.`IndustrialMachine_Code` = `Occurrence`.`IndustrialMachine_Code`
                                                                                      )
                                                                                    )
                                                                                ) 
                                                                                LEFT JOIN `RiskEvent` 
                                                                                  ON (
                                                                                    (
                                                                                      `RiskEvent`.`RiskEvent_Code` = `Occurrence`.`RiskEvent_Code`
                                                                                    )
                                                                                  )
                                                                              ) 
                                                                              LEFT JOIN `FocusFactory` 
                                                                                ON (
                                                                                  (
                                                                                    `FocusFactory`.`FocusFactory_Code` = `Occurrence`.`FocusFactory_Code`
                                                                                  )
                                                                                )
                                                                            ) 
                                                                            LEFT JOIN `Risk` 
                                                                              ON (
                                                                                (
                                                                                  `Risk`.`Risk_Code` = `Occurrence`.`Risk_Code`
                                                                                )
                                                                              )
                                                                          ) 
                                                                          LEFT JOIN `Effort` 
                                                                            ON (
                                                                              (
                                                                                `Effort`.`Effort_Code` = `Occurrence`.`Effort_Code`
                                                                              )
                                                                            )
                                                                        ) 
                                                                        LEFT JOIN `Frequency` 
                                                                          ON (
                                                                            (
                                                                              `Frequency`.`Frequency_Code` = `Occurrence`.`Frequency_Code`
                                                                            )
                                                                          )
                                                                      ) 
                                                                      LEFT JOIN `TypeIncident` 
                                                                        ON (
                                                                          (
                                                                            `TypeIncident`.`TypeIncident_Code` = `Occurrence`.`TypeIncident_Code`
                                                                          )
                                                                        )
                                                                    ) 
                                                                    LEFT JOIN `RootCauseLinkage` 
                                                                      ON (
                                                                        (
                                                                          `RootCauseLinkage`.`RootCauseLinkage_Code` = `Occurrence`.`RootCauseLinkage_Code`
                                                                        )
                                                                      )
                                                                  ) 
                                                                  LEFT JOIN `MQS` 
                                                                    ON (
                                                                      (
                                                                        `MQS`.`MQS_Code` = `Occurrence`.`MQS_Code`
                                                                      )
                                                                    )
                                                                ) 
                                                                LEFT JOIN `Disposition` 
                                                                  ON (
                                                                    (
                                                                      `Disposition`.`Disposition_Code` = `Occurrence`.`Disposition_Code`
                                                                    )
                                                                  )
                                                              ) 
                                                              LEFT JOIN `WhoCausedDefect` 
                                                                ON (
                                                                  (
                                                                    `WhoCausedDefect`.`WhoCausedDefect_Code` = `Occurrence`.`WhoCausedDefect_Code`
                                                                  )
                                                                )
                                                            ) 
                                                            LEFT JOIN `MajorEvent` 
                                                              ON (
                                                                (
                                                                  `MajorEvent`.`MajorEvent_Code` = `Occurrence`.`MajorEvent_Code`
                                                                )
                                                              )
                                                          ) 
                                                          LEFT JOIN `Department` 
                                                            ON (
                                                              (
                                                                `Department`.`Department_Code` = `Occurrence`.`Occurrence_DepartmentCode`
                                                              )
                                                            )
                                                        ) 
                                                        LEFT JOIN `Person` `Cliente` 
                                                          ON (
                                                            (
                                                              `Cliente`.`Person_Code` = `Occurrence`.`Occurrence_RequesterPersonCode`
                                                            )
                                                          )
                                                      ) 
                                                      LEFT JOIN `PersonContact` `Contato_Cliente` 
                                                        ON (
                                                          (
                                                            `Contato_Cliente`.`PersonContact_Code` = `Occurrence`.`Occurrence_RequesterPersonContactCode`
                                                          )
                                                        )
                                                    ) 
                                                    LEFT JOIN `Person` `Responsavel` 
                                                      ON (
                                                        (
                                                          `Responsavel`.`Person_Code` = `Occurrence`.`Occurrence_ResponsiblePersonCode`
                                                        )
                                                      )
                                                  ) 
                                                  LEFT JOIN `TypeAttendance` 
                                                    ON (
                                                      (
                                                        `TypeAttendance`.`TypeAttendance_Code` = `Occurrence`.`Occurrence_TypeAttendanceCode`
                                                      )
                                                    )
                                                ) 
                                                LEFT JOIN `CustomerRelationship` `Relacionamento_Cliente` 
                                                  ON (
                                                    (
                                                      `Relacionamento_Cliente`.`CustomerRelationship_Code` = `Occurrence`.`Occurrence_RequesterRelationshipCode`
                                                    )
                                                  )
                                              ) 
                                              LEFT JOIN `CustomerRelationship` `Relacionamento_Responsavel` 
                                                ON (
                                                  (
                                                    `Relacionamento_Responsavel`.`CustomerRelationship_Code` = `Occurrence`.`Occurrence_ResponsibleRelationshipCode`
                                                  )
                                                )
                                            ) 
                                            LEFT JOIN `PersonContact` `Contato_Responsavel` 
                                              ON (
                                                (
                                                  `Contato_Responsavel`.`PersonContact_Code` = `Occurrence`.`Occurrence_ResponsiblePersonContactCode`
                                                )
                                              )
                                          ) 
                                          LEFT JOIN `TypeOccurrence` 
                                            ON (
                                              (
                                                `TypeOccurrence`.`TypeOccurrence_Code` = `Occurrence`.`Occurrence_TypeOccurrenceCode`
                                              )
                                            )
                                        ) 
                                        LEFT JOIN `OccurrenceStatus` 
                                          ON (
                                            (
                                              `OccurrenceStatus`.`OccurrenceStatus_Code` = `Occurrence`.`Occurrence_OccurrenceStatusCode`
                                            )
                                          )
                                      ) 
                                      LEFT JOIN `OccurrenceClass` 
                                        ON (
                                          (
                                            `OccurrenceClass`.`OccurrenceClass_Code` = `Occurrence`.`OccurrenceClass_Code`
                                          )
                                        )
                                    ) 
                                    LEFT JOIN `OccurrenceSituation` 
                                      ON (
                                        (
                                          `OccurrenceSituation`.`OccurrenceSituation_Code` = `Occurrence`.`OccurrenceSituation_Code`
                                        )
                                      )
                                  ) 
                                  LEFT JOIN `Escalation` 
                                    ON (
                                      (
                                        `Escalation`.`Escalation_Code` = `Occurrence`.`Occurrence_EscalationDefaultCode`
                                      )
                                    )
                                ) 
                                LEFT JOIN `OccurrenceProduct` 
                                  ON (
                                    (
                                      `OccurrenceProduct`.`Occurrence_Code` = `Occurrence`.`Occurrence_Code`
                                    )
                                  )
                              ) 
                              LEFT JOIN `Product` 
                                ON (
                                  (
                                    `Product`.`Product_Code` = `OccurrenceProduct`.`Product_Code`
                                  )
                                )
                            ) 
                            LEFT JOIN `ProductClassification` 
                              ON (
                                (
                                  `ProductClassification`.`ProductClassification_Code` = `Product`.`Product_Code`
                                )
                              )
                          ) 
                          LEFT JOIN `ProductFamily` 
                            ON (
                              (
                                `ProductFamily`.`ProductFamily_Code` = `ProductClassification`.`ProductFamily_Code`
                              )
                            )
                        ) 
                        LEFT JOIN `LaunchSeries` 
                          ON (
                            (
                              `LaunchSeries`.`LaunchSeries_Code` = `ProductClassification`.`LaunchSeries_Code`
                            )
                          )
                      ) 
                      LEFT JOIN `Project` 
                        ON (
                          (
                            `Project`.`Project_Code` = `ProductClassification`.`Project_Code`
                          )
                        )
                    ) 
                    LEFT JOIN `Context` 
                      ON (
                        (
                          `Context`.`Company_Code` = `Occurrence`.`Occurrence_ContextCode`
                        )
                      )
                  ) 
                  LEFT JOIN `Company` 
                    ON (
                      (
                        `Company`.`Company_Code` = `Context`.`Company_Code`
                      )
                    )
                ) 
                LEFT JOIN 
                  (SELECT 
                    `OccurrenceCosts`.`Occurrence_Code` AS `OcorrenceCusto`,
                    SUM(
                      `OccurrenceCosts`.`OccurrenceCosts_Amount`
                    ) AS `Costs` 
                  FROM
                    `OccurrenceCosts` 
                  GROUP BY `OccurrenceCosts`.`Occurrence_Code`) `COSTs` 
                  ON (
                    (
                      `COSTs`.`OcorrenceCusto` = `Occurrence`.`Occurrence_Code`
                    )
                  )
              ) 
              LEFT JOIN 
                (SELECT 
                  `ao`.`Occurrence_Code` AS `Occurrence_Code`,
                  SUM(`ao`.`Activity_open`) AS `Activity_open`,
                  SUM(`ao`.`DELAY`) AS `Activity_delay` 
                FROM
                  (SELECT 
                    `a`.`Activity_OccurrenceCode` AS `Occurrence_Code`,
                    1 AS `Activity_open`,
                    (
                      CASE
                        WHEN (
                          (
                            `a`.`Activity_ReplannedDate` > `a`.`Activity_PlannedDate`
                          ) 
                          AND (
                            `a`.`Activity_ReplannedDate` < CURDATE()
                          )
                        ) 
                        THEN 1 
                        WHEN (
                          (
                            `a`.`Activity_ReplannedDate` < `a`.`Activity_PlannedDate`
                          ) 
                          AND (
                            `a`.`Activity_PlannedDate` < CURDATE()
                          )
                        ) 
                        THEN 1 
                        ELSE 0 
                      END
                    ) AS `DELAY`,
                    `a`.`Activity_PlannedDate` AS `Activity_PlannedDate`,
                    `a`.`Activity_ReplannedDate` AS `Activity_ReplannedDate` 
                  FROM
                    (
                      (
                        `Activity` `a` 
                        JOIN `ActivityWorkflowStages` `aws` 
                          ON (
                            `aws`.`ActivityWorkflowStages_ActivityCode` = `a`.`Activity_Code`
                            AND `aws`.`ActivityWorkflowStages_TupleExcluded` = 0
                          )
                      )
                      JOIN `WorkflowStages` `w` 
                        ON (
                          `w`.`WorkflowStages_Code` = `aws`.`ActivityWorkflowStages_WorkflowStagesCode`
                        )
                    ) 
                  WHERE (
                      (
                        `w`.`WorkflowStages_ActivityClosed` = 0
                      ) 
                      AND (
                        `a`.`Activity_OccurrenceCode` IS NOT NULL
                      )
                    )) `ao` 
                GROUP BY `ao`.`Occurrence_Code`) `oa` 
                ON (
                  (
                    `oa`.`Occurrence_Code` = `Occurrence`.`Occurrence_Code`
                  )
                )
            ) 
            LEFT JOIN 
              (SELECT 
                `A`.`Occurrence_Code_ICA` AS `Occurrence_Code_ICA`,
                `A`.`Activity_PlannedDate_ICA` AS `Activity_PlannedDate_ICA`,
                (
                  CASE
                    WHEN (
                      `A`.`min_ImplementedDate_ICA` = '1000-01-01'
                    ) 
                    THEN NULL 
                    ELSE `A`.`mAX_ImplementedDate_ICA` 
                  END
                ) AS `mAX_ImplementedDate_ICA` 
              FROM
                (SELECT 
                  `a`.`Activity_OccurrenceCode` AS `Occurrence_Code_ICA`,
                  MAX(`a`.`Activity_PlannedDate`) AS `Activity_PlannedDate_ICA`,
                  MIN(`a`.`Activity_ImplementedDate`) AS `min_ImplementedDate_ICA`,
                  MAX(`a`.`Activity_ImplementedDate`) AS `mAX_ImplementedDate_ICA`,
                  GROUP_CONCAT(
                    `a`.`Activity_Title` SEPARATOR ','
                  ) AS `Activity_Title` 
                FROM
                  (
                    `Activity` `a` 
                    JOIN `TypeActivity` 
                      ON (
                        (
                          `TypeActivity`.`TypeActivity_Code` = `a`.`TypeActivity_Code`
                        )
                      )
                  ) 
                WHERE (
                    (
                      `TypeActivity`.`TypeActivity_Description` = 'ICA'
                    ) 
                    AND (`a`.`Activity_TupleExcluded` = 0)
                  ) 
                GROUP BY `a`.`Activity_OccurrenceCode`) `A`) `ICA` 
              ON (
                (
                  `ICA`.`Occurrence_Code_ICA` = `Occurrence`.`Occurrence_Code`
                )
              )
          ) 
          LEFT JOIN 
            (SELECT 
              `A`.`Occurrence_Code_PCA` AS `Occurrence_Code_PCA`,
              `A`.`Activity_PlannedDate_PCA` AS `Activity_PlannedDate_PCA`,
              `A`.`Activity_Title_pca` AS `Activity_Title_pca`,
              (
                CASE
                  WHEN (
                    `A`.`min_ImplementedDate_PCA` = '1000-01-01'
                  ) 
                  THEN NULL 
                  ELSE `A`.`mAX_ImplementedDate_PCA` 
                END
              ) AS `mAX_ImplementedDate_PCA` 
            FROM
              (SELECT 
                `a`.`Activity_OccurrenceCode` AS `Occurrence_Code_PCA`,
                MAX(`a`.`Activity_PlannedDate`) AS `Activity_PlannedDate_PCA`,
                MIN(`a`.`Activity_ImplementedDate`) AS `min_ImplementedDate_PCA`,
                MAX(`a`.`Activity_ImplementedDate`) AS `mAX_ImplementedDate_PCA`,
                GROUP_CONCAT(
                  DISTINCT regexp_replace (
                    `a`.`Activity_Detail`,
                    '<[^>]*>',
                    ''
                  ) SEPARATOR ','
                ) AS `Activity_Title_pca` 
              FROM
                (
                  (
                    `Activity` `a` 
                    JOIN `TypeActivity` 
                      ON (
                        (
                          `TypeActivity`.`TypeActivity_Code` = `a`.`TypeActivity_Code`
                        )
                      )
                  ) 
                  JOIN `ActivitySection` 
                    ON (
                      (
                        `a`.`ActivitySection_Code` = `ActivitySection`.`ActivitySection_Code`
                      )
                    )
                ) 
              WHERE (
                  (
                    `TypeActivity`.`TypeActivity_Description` = 'PCA'
                  ) 
                  AND (`a`.`Activity_TupleExcluded` = 0) 
                  AND (
                    `ActivitySection`.`ActivitySection_Description` LIKE '10%'
                  )
                ) 
              GROUP BY `a`.`Activity_OccurrenceCode`) `A`) `PCA` 
            ON (
              (
                `PCA`.`Occurrence_Code_PCA` = `Occurrence`.`Occurrence_Code`
              )
            )
        ) 
        LEFT JOIN `Customer` 
          ON (
            (
              `Customer`.`Customer_Code` = `Relacionamento_Cliente`.`CustomerRelationship_CustomerCode`
            )
          )
      ) 
      LEFT JOIN `CustomerClass` 
        ON (
          (
            `CustomerClass`.`CustomerClass_Code` = `Customer`.`CustomerClass_Code`
          )
        )
    ) 
    LEFT JOIN 
      (SELECT 
        `OccurrenceCauses`.`Occurrence_Code` AS `cause_occu_code`,
        GROUP_CONCAT(
          DISTINCT regexp_replace (
            `OccurrenceCauses`.`OccurrenceCauses_Detail`,
            '<[^>]*>',
            ''
          ) SEPARATOR ','
        ) AS `OccurrenceCauses_Detail` 
      FROM
        `OccurrenceCauses` 
      WHERE (
          `OccurrenceCauses`.`OccurrenceCauses_TupleExcluded` = 0
        ) 
      GROUP BY `OccurrenceCauses`.`Occurrence_Code`) `occ` 
      ON (
        (
          `occ`.`cause_occu_code` = `Occurrence`.`Occurrence_Code`
        )
      )
      LEFT JOIN
      (SELECT 
        Occurrence_Code AS indicator_occu_code,
        GROUP_CONCAT(
          DISTINCT regexp_replace (
            Indicator.Indicator_Description,
            '<[^>]*>',
            ''
          ) SEPARATOR ','
        ) AS Indicator 
      FROM
         OccurrenceIndicator
        JOIN Indicator ON Indicator.Indicator_Code = OccurrenceIndicator.Indicator_Code
      WHERE  OccurrenceIndicator_TupleExcluded = 0
      GROUP BY Occurrence_Code
      ) ocd ON indicator_occu_code = `Occurrence`.`Occurrence_Code`
  ) 
WHERE (
    (
      `Occurrence`.`Occurrence_TupleExcluded` = 0
    ) 
    AND (
      (
        `OccurrenceProduct`.`OccurrenceProduct_TupleExcluded` = 0
      ) 
      OR (
        `OccurrenceProduct`.`OccurrenceProduct_TupleExcluded` IS NULL
      )
    )
  ) 

