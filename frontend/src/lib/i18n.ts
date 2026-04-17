export type Locale = "pt-BR" | "en-US";

type Dictionary = {
  appEyebrow: string;
  appTitle: string;
  appSubtitle: string;
  languageLabel: string;
  openReportsMenu: string;
  closeReportsMenu: string;
  appSummaryLabel: string;
  reportContextSummaryLabel: string;
  availableReportsSummaryLabel: string;
  blockedReportsSummaryLabel: string;
  tableDensityShortLabel: string;
  tableHeaderSizeShortLabel: string;
  availableReports: string;
  blockedReports: string;
  availableReportsDescription: string;
  blockedReportsDescription: string;
  blockedByPermissions: string;
  loadingCatalog: string;
  loadError: string;
  specialistTitle: string;
  specialistSubtitle: string;
  reportNavigation: string;
  reportNavigationDescription: string;
  previewUnavailable: string;
  loadingPreview: string;
  noPreviewRows: string;
  currentPreviewRows: string;
  kpiSectionTitle: string;
  overviewSectionTitle: string;
  chartSectionTitle: string;
  correlationSectionTitle: string;
  selectReportHint: string;
  chartPie: string;
  chartBar: string;
  chartCombo: string;
  chartNoData: string;
  chartLegendCount: string;
  chartLegendAverage: string;
  statusAvailable: string;
  statusBlocked: string;
  rowCount: string;
  filteredRows: string;
  numericAverage: string;
  fillRate: string;
  topCategory: string;
  suggestedGrouping: string;
  sampleRecord: string;
  filterSectionTitle: string;
  filterSectionDescription: string;
  clearFilters: string;
  filterPlaceholder: string;
  activeFilters: string;
  drillDownApplied: string;
  clearDrillDown: string;
  detailSectionTitle: string;
  detailSectionDescription: string;
  exportCsv: string;
  pageLabel: string;
  previousPage: string;
  nextPage: string;
  correlationAcrossReportsTitle: string;
  correlationAcrossReportsDescription: string;
  sharedValues: string;
  dataSourceLabel: string;
  technicalFieldLabel: string;
  collapseNavigation: string;
  expandNavigation: string;
  navigationSummary: string;
  reportContextTitle: string;
  sectionNavLabel: string;
  sectionOverview: string;
  sectionFilters: string;
  sectionCharts: string;
  sectionCorrelations: string;
  sectionCrossReport: string;
  sectionDetails: string;
  tableDensityLabel: string;
  compactMode: string;
  comfortableMode: string;
  currentReportLabel: string;
  sqlSourceLabel: string;
  columnControlsTitle: string;
  visibleColumnsLabel: string;
  hideColumn: string;
  showColumn: string;
  tableHeaderSizeLabel: string;
  headerSmall: string;
  headerMedium: string;
  headerLarge: string;
  showAllColumns: string;
  resetTableLayout: string;
  dragToReorder: string;
  resizeColumn: string;
  quickFiltersTitle: string;
  sortAscending: string;
  sortDescending: string;
  clearSort: string;
  pinColumn: string;
  unpinColumn: string;
  frozenColumn: string;
  chartGroupingLabel: string;
  chartGroupingPlaceholder: string;
  dateRangeLabel: string;
  dateFromLabel: string;
  dateToLabel: string;
  dateRangeHelp: string;
  periodSelectorLabel: string;
  vdaBandA: string;
  vdaBandB: string;
  vdaBandC: string;
  slaThreshold15: string;
  slaThreshold60: string;
  slaAlert: string;
  withinSlaLabel: string;
  overSlaLabel: string;
  movingAverageLabel: string;
  targetLineLabel: string;
  emptyStateNoData: string;
  showTechnicalFields: string;
  hideTechnicalFields: string;
  technicalFieldsHidden: string;
  auditScoreLabel: string;
  completionLevelLabel: string;
  drillDownTableTitle: string;
  periodoMes: string;
  periodoTrimestre: string;
  periodoYtd: string;
  emptyImplementedDate: string;
  kpiScoreByTypeLevel: string;
  kpiSla: string;
  kpiTrend: string;
  kpiFunnel: string;
  kpiHeatmap: string;
  kpiTopMachines: string;
  kpiSemDados: string;
  kpiIatfUnassignedFlag: string;
  chartEmptyState: string;
  chartEmptyHint: string;
  chartInsightDefault: string;
  heatmapToggle12m: string;
  heatmapToggle3y: string;
  heatmapSmallSample: string;
  heatmapAdherenceLabel: string;
  heatmapGapLabel: string;
  heatmapFilterSector: string;
  heatmapFilterType: string;
  heatmapFilterAll: string;
  heatmapFilterClear: string;
  heatmapZoomIn: string;
  heatmapZoomOut: string;
  heatmapZoomReset: string;
  heatmapSelectPrompt: string;
  heatmapShowAll: string;
  funnelFootnote: string;
  funnelReplannedAnnotation: string;
  funnelVdaScoreLabel: string;
  scatterAnticipated: string;
  scatterDelayed: string;
};

export const translations: Record<Locale, Dictionary> = {
  "pt-BR": {
    appEyebrow: "Plataforma Analítica Magna",
    appTitle: "Dashboards executivos para operações Magna",
    appSubtitle:
      "Um cockpit analítico bilíngue para navegar relatórios, destacar KPIs, sugerir correlações e acelerar decisões de gerência e diretoria.",
    languageLabel: "Idioma",
    openReportsMenu: "Abrir menu de relatórios",
    closeReportsMenu: "Fechar menu de relatórios",
    appSummaryLabel: "Resumo da plataforma",
    reportContextSummaryLabel: "Resumo do contexto do relatório",
    availableReportsSummaryLabel: "Ajuda sobre relatórios disponíveis",
    blockedReportsSummaryLabel: "Ajuda sobre relatórios bloqueados",
    tableDensityShortLabel: "Densidade",
    tableHeaderSizeShortLabel: "Header",
    availableReports: "Relatórios Disponíveis",
    blockedReports: "Bloqueados por Permissão",
    availableReportsDescription:
      "Navegue pelos seis conjuntos de dados liberados para o usuário atual do banco e visualize previews analíticos.",
    blockedReportsDescription:
      "Esses relatórios estão registrados, mas o usuário atual do MySQL ainda não possui acesso às tabelas necessárias.",
    blockedByPermissions: "Bloqueado por permissões",
    loadingCatalog: "Carregando catálogo de relatórios...",
    loadError: "Não foi possível carregar o catálogo de relatórios agora.",
    specialistTitle: "Especialista em Dashboards e Relatórios",
    specialistSubtitle:
      "Sugestões de data science com agrupamentos, KPIs, correlações e gráficos interativos para o relatório selecionado.",
    reportNavigation: "Navegação por Relatório",
    reportNavigationDescription:
      "Escolha um relatório disponível para abrir a visão geral, os indicadores e os gráficos sugeridos.",
    previewUnavailable: "Preview indisponível.",
    loadingPreview: "Carregando preview...",
    noPreviewRows: "Nenhuma linha retornada no preview.",
    currentPreviewRows: "linhas no preview atual",
    kpiSectionTitle: "Cards de KPI",
    overviewSectionTitle: "Visão Geral",
    chartSectionTitle: "Gráficos Interativos",
    correlationSectionTitle: "Sugestões de Correlação",
    selectReportHint: "Selecione um relatório para começar a explorar os dados.",
    chartPie: "Pizza",
    chartBar: "Barra",
    chartCombo: "Barra + Linha",
    chartNoData: "Não há dados suficientes para renderizar este gráfico.",
    chartLegendCount: "Volume",
    chartLegendAverage: "Média",
    statusAvailable: "Disponível",
    statusBlocked: "Bloqueado",
    rowCount: "Linhas",
    filteredRows: "Linhas filtradas",
    numericAverage: "Média numérica",
    fillRate: "Preenchimento",
    topCategory: "Categoria líder",
    suggestedGrouping: "Agrupamento sugerido",
    sampleRecord: "Amostra do primeiro registro",
    filterSectionTitle: "Filtros analíticos",
    filterSectionDescription:
      "Refine a visão por campos-chave do relatório. Os filtros usam rótulos semânticos e explicam a origem do dado.",
    clearFilters: "Limpar filtros",
    filterPlaceholder: "Todos",
    activeFilters: "Filtros ativos",
    drillDownApplied: "Drill-down aplicado",
    clearDrillDown: "Remover drill-down",
    detailSectionTitle: "Detalhamento dos registros",
    detailSectionDescription:
      "Tabela paginada do recorte atual, pronta para conferência operacional e exportação do subconjunto filtrado.",
    exportCsv: "Exportar CSV",
    pageLabel: "Página",
    previousPage: "Anterior",
    nextPage: "Próxima",
    correlationAcrossReportsTitle: "Correlação entre relatórios",
    correlationAcrossReportsDescription:
      "Pontes entre relatórios por conceitos de negócio compartilhados, como tipo, responsável, focus factory e datas.",
    sharedValues: "Valores em comum",
    dataSourceLabel: "Fonte",
    technicalFieldLabel: "Campo",
    collapseNavigation: "Recolher navegação",
    expandNavigation: "Expandir navegação",
    navigationSummary: "Menu de relatórios",
    reportContextTitle: "Contexto do relatório",
    sectionNavLabel: "Seções do relatório",
    sectionOverview: "Visão geral",
    sectionFilters: "Filtros",
    sectionCharts: "Gráficos",
    sectionCorrelations: "Correlação interna",
    sectionCrossReport: "Entre relatórios",
    sectionDetails: "Detalhamento",
    tableDensityLabel: "Densidade da tabela",
    compactMode: "Modo compacto",
    comfortableMode: "Modo confortável",
    currentReportLabel: "Relatório atual",
    sqlSourceLabel: "Arquivo SQL",
    columnControlsTitle: "Colunas da tabela",
    visibleColumnsLabel: "Colunas visíveis",
    hideColumn: "Ocultar coluna",
    showColumn: "Mostrar coluna",
    tableHeaderSizeLabel: "Tamanho do header",
    headerSmall: "Header pequeno",
    headerMedium: "Header médio",
    headerLarge: "Header grande",
    showAllColumns: "Mostrar todas as colunas",
    resetTableLayout: "Resetar layout da tabela",
    dragToReorder: "Arraste para reordenar",
    resizeColumn: "Redimensionar coluna",
    quickFiltersTitle: "Filtros rápidos por coluna",
    sortAscending: "Ordenar crescente",
    sortDescending: "Ordenar decrescente",
    clearSort: "Limpar ordenação",
    pinColumn: "Fixar coluna",
    unpinColumn: "Desafixar coluna",
    frozenColumn: "Coluna fixa",
    chartGroupingLabel: "Agrupar por",
    chartGroupingPlaceholder: "Selecione o agrupamento",
    dateRangeLabel: "Período",
    dateFromLabel: "De",
    dateToLabel: "Até",
    dateRangeHelp: "Filtra ocorrências e registros entre duas datas usando o campo principal de data do relatório.",
    periodSelectorLabel: "Período temporal",
    vdaBandA: "Classe A",
    vdaBandB: "Classe B",
    vdaBandC: "Classe C",
    slaThreshold15: "15 dias",
    slaThreshold60: "60 dias",
    slaAlert: "Prazo crítico",
    withinSlaLabel: "Dentro do SLA",
    overSlaLabel: "Acima de 60d",
    movingAverageLabel: "Média móvel",
    targetLineLabel: "Meta",
    emptyStateNoData: "Sem dados para este recorte.",
    showTechnicalFields: "Ver campos técnicos",
    hideTechnicalFields: "Ocultar campos técnicos",
    technicalFieldsHidden: "Campos técnicos ocultos",
    auditScoreLabel: "Score médio",
    completionLevelLabel: "Nível de conclusão",
    drillDownTableTitle: "Detalhamento",
    periodoMes: "Mês",
    periodoTrimestre: "Trimestre",
    periodoYtd: "YTD",
    emptyImplementedDate: "Sem data de implementação",
    kpiScoreByTypeLevel: "Score médio de auditoria",
    kpiSla: "Distribuição de SLA",
    kpiTrend: "Progresso vs meta",
    kpiFunnel: "Funil de estágios",
    kpiHeatmap: "Pares setor × nível",
    kpiTopMachines: "Máquina principal",
    kpiSemDados: "Sem dados",
    kpiIatfUnassignedFlag: "Atenção IATF 16949 §7.2.3: responsável não atribuído",
    chartEmptyState: "Sem dados no período selecionado",
    chartEmptyHint: "amplie o período ou remova filtros",
    chartInsightDefault: "Visão analítica do período selecionado",
    heatmapToggle12m: "12 meses — operacional",
    heatmapToggle3y: "3 anos — IATF 9.2.2.2 cobertura trienal",
    heatmapSmallSample: "amostra muito pequena",
    heatmapAdherenceLabel: "% aderência",
    heatmapGapLabel: "gap",
    heatmapFilterSector: "Setor",
    heatmapFilterType: "Tipo",
    heatmapFilterAll: "Todos",
    heatmapFilterClear: "Limpar filtros",
    heatmapZoomIn: "Ampliar",
    heatmapZoomOut: "Reduzir",
    heatmapZoomReset: "Resetar zoom",
    heatmapSelectPrompt: "Selecione setores ou tipos para visualizar o mapa de cobertura",
    heatmapShowAll: "Mostrar todos",
    funnelFootnote: "Auditorias realizadas fora da tolerância de 30 dias não contam para esta etapa",
    funnelReplannedAnnotation: "Replanejadas",
    funnelVdaScoreLabel: "Score ≥ 70 (VDA B ou superior)",
    scatterAnticipated: "Antecipadas",
    scatterDelayed: "Adiadas",
  },
  "en-US": {
    appEyebrow: "Magna Analytics Platform",
    appTitle: "Executive dashboards for Magna operations",
    appSubtitle:
      "A bilingual analytics cockpit to navigate reports, surface KPIs, suggest correlations, and speed up management and executive decisions.",
    languageLabel: "Language",
    openReportsMenu: "Open reports menu",
    closeReportsMenu: "Close reports menu",
    appSummaryLabel: "Platform summary",
    reportContextSummaryLabel: "Report context summary",
    availableReportsSummaryLabel: "Help about available reports",
    blockedReportsSummaryLabel: "Help about blocked reports",
    tableDensityShortLabel: "Density",
    tableHeaderSizeShortLabel: "Header",
    availableReports: "Available Reports",
    blockedReports: "Blocked by Permissions",
    availableReportsDescription:
      "Navigate the six datasets currently available to the configured database user and inspect analytical previews.",
    blockedReportsDescription:
      "These reports are registered, but the current MySQL user still cannot access all required tables.",
    blockedByPermissions: "Blocked by permissions",
    loadingCatalog: "Loading report catalog...",
    loadError: "Unable to load the report catalog right now.",
    specialistTitle: "Dashboard and Reporting Specialist",
    specialistSubtitle:
      "Data science suggestions with groupings, KPIs, correlations, and interactive charts for the selected report.",
    reportNavigation: "Report Navigation",
    reportNavigationDescription:
      "Choose an available report to open its overview, indicators, and suggested visual analytics.",
    previewUnavailable: "Preview unavailable.",
    loadingPreview: "Loading preview...",
    noPreviewRows: "No preview rows returned.",
    currentPreviewRows: "rows in current preview",
    kpiSectionTitle: "KPI Cards",
    overviewSectionTitle: "Overview",
    chartSectionTitle: "Interactive Charts",
    correlationSectionTitle: "Correlation Suggestions",
    selectReportHint: "Select a report to start exploring the data.",
    chartPie: "Pie",
    chartBar: "Bar",
    chartCombo: "Bar + Line",
    chartNoData: "There is not enough data to render this chart.",
    chartLegendCount: "Volume",
    chartLegendAverage: "Average",
    statusAvailable: "Available",
    statusBlocked: "Blocked",
    rowCount: "Rows",
    filteredRows: "Filtered rows",
    numericAverage: "Numeric average",
    fillRate: "Fill rate",
    topCategory: "Top category",
    suggestedGrouping: "Suggested grouping",
    sampleRecord: "First record sample",
    filterSectionTitle: "Analytical filters",
    filterSectionDescription:
      "Refine the view using key report fields. Filters use semantic labels and explain the source of each field.",
    clearFilters: "Clear filters",
    filterPlaceholder: "All",
    activeFilters: "Active filters",
    drillDownApplied: "Drill-down applied",
    clearDrillDown: "Clear drill-down",
    detailSectionTitle: "Record details",
    detailSectionDescription:
      "Paginated table of the current slice, ready for operational verification and filtered subset export.",
    exportCsv: "Export CSV",
    pageLabel: "Page",
    previousPage: "Previous",
    nextPage: "Next",
    correlationAcrossReportsTitle: "Cross-report correlation",
    correlationAcrossReportsDescription:
      "Bridges across reports using shared business concepts such as type, owner, focus factory, and dates.",
    sharedValues: "Shared values",
    dataSourceLabel: "Source",
    technicalFieldLabel: "Field",
    collapseNavigation: "Collapse navigation",
    expandNavigation: "Expand navigation",
    navigationSummary: "Reports menu",
    reportContextTitle: "Report context",
    sectionNavLabel: "Report sections",
    sectionOverview: "Overview",
    sectionFilters: "Filters",
    sectionCharts: "Charts",
    sectionCorrelations: "Internal correlation",
    sectionCrossReport: "Across reports",
    sectionDetails: "Details",
    tableDensityLabel: "Table density",
    compactMode: "Compact mode",
    comfortableMode: "Comfortable mode",
    currentReportLabel: "Current report",
    sqlSourceLabel: "SQL file",
    columnControlsTitle: "Table columns",
    visibleColumnsLabel: "Visible columns",
    hideColumn: "Hide column",
    showColumn: "Show column",
    tableHeaderSizeLabel: "Header size",
    headerSmall: "Small header",
    headerMedium: "Medium header",
    headerLarge: "Large header",
    showAllColumns: "Show all columns",
    resetTableLayout: "Reset table layout",
    dragToReorder: "Drag to reorder",
    resizeColumn: "Resize column",
    quickFiltersTitle: "Quick column filters",
    sortAscending: "Sort ascending",
    sortDescending: "Sort descending",
    clearSort: "Clear sort",
    pinColumn: "Pin column",
    unpinColumn: "Unpin column",
    frozenColumn: "Pinned column",
    chartGroupingLabel: "Group by",
    chartGroupingPlaceholder: "Select grouping",
    dateRangeLabel: "Date range",
    dateFromLabel: "From",
    dateToLabel: "To",
    dateRangeHelp: "Filters occurrences and records between two dates using the report main date field.",
    periodSelectorLabel: "Time period",
    vdaBandA: "Class A",
    vdaBandB: "Class B",
    vdaBandC: "Class C",
    slaThreshold15: "15 days",
    slaThreshold60: "60 days",
    slaAlert: "Critical deadline",
    withinSlaLabel: "Within SLA",
    overSlaLabel: "Over 60d",
    movingAverageLabel: "Moving average",
    targetLineLabel: "Target",
    emptyStateNoData: "No data for this selection.",
    showTechnicalFields: "Show technical fields",
    hideTechnicalFields: "Hide technical fields",
    technicalFieldsHidden: "Technical fields hidden",
    auditScoreLabel: "Avg. score",
    completionLevelLabel: "Completion level",
    drillDownTableTitle: "Drill-down",
    periodoMes: "Month",
    periodoTrimestre: "Quarter",
    periodoYtd: "YTD",
    emptyImplementedDate: "No implementation date",
    kpiScoreByTypeLevel: "Avg. audit score",
    kpiSla: "SLA distribution",
    kpiTrend: "Progress vs target",
    kpiFunnel: "Workflow funnel",
    kpiHeatmap: "Sector × level pairs",
    kpiTopMachines: "Top machine",
    kpiSemDados: "No data",
    kpiIatfUnassignedFlag: "IATF 16949 §7.2.3 alert: unassigned owner",
    chartEmptyState: "No data in selected period",
    chartEmptyHint: "expand the period or remove filters",
    chartInsightDefault: "Analytical view of the selected period",
    heatmapToggle12m: "12 months — operational",
    heatmapToggle3y: "3 years — IATF 9.2.2.2 triennial coverage",
    heatmapSmallSample: "very small sample",
    heatmapAdherenceLabel: "% adherence",
    heatmapGapLabel: "gap",
    heatmapFilterSector: "Sector",
    heatmapFilterType: "Type",
    heatmapFilterAll: "All",
    heatmapFilterClear: "Clear filters",
    heatmapZoomIn: "Zoom in",
    heatmapZoomOut: "Zoom out",
    heatmapZoomReset: "Reset zoom",
    heatmapSelectPrompt: "Select sectors or types to view the coverage map",
    heatmapShowAll: "Show all",
    funnelFootnote: "Audits executed outside the 30-day tolerance do not count for this stage",
    funnelReplannedAnnotation: "Replanned",
    funnelVdaScoreLabel: "Score ≥ 70 (VDA B or higher)",
    scatterAnticipated: "Anticipated",
    scatterDelayed: "Delayed",
  },
};
