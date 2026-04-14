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
  },
};
