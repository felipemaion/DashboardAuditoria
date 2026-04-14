import { useQueries, useQuery } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { translations, type Locale } from "../lib/i18n";
import type { ReportRecord } from "../lib/reportInsights";
import {
  applyReportFilters,
  buildCrossReportInsights,
  buildCsv,
  buildFilterDefinitions,
  paginateRows,
} from "../lib/reportExplorer.testable";
import {
  getFieldMeta,
  getReportSemanticView,
  getReportTitle,
} from "../lib/reportSemantics";
import { InfoTip } from "./InfoTip";
import { ReportCharts } from "./ReportCharts";

export type ReportAvailabilityStatus = "available" | "blocked_by_permissions" | "query_error";

export type ReportCatalogItem = {
  report_id: string;
  title: string;
  sql_file_name: string;
  status: ReportAvailabilityStatus;
  blocked_reason: string | null;
};

type ReportCatalogResponse = {
  reports: ReportCatalogItem[];
};

type ReportResponse = {
  report_id: string;
  title: string;
  limit: number;
  offset: number;
  row_count: number;
  rows: ReportRecord[];
};

const PAGE_SIZE = 10;
const LAYOUT_STORAGE_KEY = "dashboard-magna-layout";
const DEFAULT_COLUMN_WIDTH = 180;

type TableDensity = "compact" | "comfortable";
type TableHeaderSize = "small" | "medium" | "large";
type SortDirection = "asc" | "desc";
type SortState = {
  field: string;
  direction: SortDirection;
};

type LayoutPreferences = {
  sidebarCollapsed: boolean;
  tableDensity: TableDensity;
  tableHeaderSize: TableHeaderSize;
  hiddenColumnsByReport: Record<string, string[]>;
  columnOrderByReport: Record<string, string[]>;
  columnWidthsByReport: Record<string, Record<string, number>>;
  pinnedColumnsByReport: Record<string, string[]>;
  sortByReport: Record<string, SortState | null>;
  quickFiltersByReport: Record<string, Record<string, string>>;
};

const defaultLayoutPreferences: LayoutPreferences = {
  sidebarCollapsed: false,
  tableDensity: "comfortable",
  tableHeaderSize: "medium",
  hiddenColumnsByReport: {},
  columnOrderByReport: {},
  columnWidthsByReport: {},
  pinnedColumnsByReport: {},
  sortByReport: {},
  quickFiltersByReport: {},
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function readLayoutPreferences(): LayoutPreferences {
  if (typeof window === "undefined") {
    return defaultLayoutPreferences;
  }

  const rawValue = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
  if (!rawValue) {
    return defaultLayoutPreferences;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<LayoutPreferences>;
    return {
      sidebarCollapsed: Boolean(parsedValue.sidebarCollapsed),
      tableDensity: parsedValue.tableDensity === "compact" ? "compact" : "comfortable",
      tableHeaderSize:
        parsedValue.tableHeaderSize === "small" || parsedValue.tableHeaderSize === "large"
          ? parsedValue.tableHeaderSize
          : "medium",
      hiddenColumnsByReport:
        parsedValue.hiddenColumnsByReport && typeof parsedValue.hiddenColumnsByReport === "object"
          ? parsedValue.hiddenColumnsByReport
          : {},
      columnOrderByReport:
        parsedValue.columnOrderByReport && typeof parsedValue.columnOrderByReport === "object"
          ? parsedValue.columnOrderByReport
          : {},
      columnWidthsByReport:
        parsedValue.columnWidthsByReport && typeof parsedValue.columnWidthsByReport === "object"
          ? parsedValue.columnWidthsByReport
          : {},
      pinnedColumnsByReport:
        parsedValue.pinnedColumnsByReport && typeof parsedValue.pinnedColumnsByReport === "object"
          ? parsedValue.pinnedColumnsByReport
          : {},
      sortByReport:
        parsedValue.sortByReport && typeof parsedValue.sortByReport === "object"
          ? parsedValue.sortByReport
          : {},
      quickFiltersByReport:
        parsedValue.quickFiltersByReport && typeof parsedValue.quickFiltersByReport === "object"
          ? parsedValue.quickFiltersByReport
          : {},
    };
  } catch {
    return defaultLayoutPreferences;
  }
}

function normalizeString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function compareValues(leftValue: unknown, rightValue: unknown): number {
  return normalizeString(leftValue).localeCompare(normalizeString(rightValue), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function buildCollapsedReportLabel(reportId: string, title: string, locale: Locale): string {
  const semanticTitle = getReportTitle(reportId, locale, title);
  const sourceWords = reportId
    .split(/[-_]+/)
    .filter(Boolean)
    .filter((word) => !["de", "do", "da", "dos", "das", "e"].includes(word.toLowerCase()));
  const compactWords = sourceWords
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.slice(0, 3).toUpperCase());

  return compactWords.join(" ") || semanticTitle.slice(0, 6).toUpperCase();
}

function SampleRecord({
  reportId,
  row,
  locale,
}: {
  reportId: string;
  row: ReportRecord | undefined;
  locale: Locale;
}) {
  const dictionary = translations[locale];

  if (!row) {
    return <p className="status-copy">{dictionary.noPreviewRows}</p>;
  }

  return (
    <div className="sample-record">
      <h4>{dictionary.sampleRecord}</h4>
      <dl className="sample-record-grid">
        {Object.entries(row)
          .slice(0, 8)
          .map(([key, value]) => (
            <div key={key} className="sample-record-item">
              <dt>
                {getFieldMeta(reportId, key)?.label[locale] ?? key}
                {getFieldMeta(reportId, key) ? (
                  <InfoTip
                    content={`${getFieldMeta(reportId, key)?.description[locale]} Fonte: ${
                      getFieldMeta(reportId, key)?.source
                    }`}
                  />
                ) : null}
              </dt>
              <dd>{value === null || value === undefined || value === "" ? "-" : String(value)}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}

function CorrelationList({
  reportId,
  locale,
  suggestions,
}: {
  reportId: string;
  locale: Locale;
  suggestions: Array<{
    id: string;
    leftField: string;
    rightField: string;
    rationale: string;
  }>;
}) {
  return (
    <div className="correlation-list">
      {suggestions.map((suggestion) => (
        <article className="correlation-card" key={suggestion.id}>
          <h4>
            {getFieldMeta(reportId, suggestion.leftField)?.label[locale] ?? suggestion.leftField} ×{" "}
            {getFieldMeta(reportId, suggestion.rightField)?.label[locale] ?? suggestion.rightField}
          </h4>
          <p>{suggestion.rationale}</p>
        </article>
      ))}
    </div>
  );
}

export function ReportExplorer({ locale }: { locale: Locale }) {
  const dictionary = translations[locale];
  const [layoutPreferences, setLayoutPreferences] = useState<LayoutPreferences>(readLayoutPreferences);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const catalogQuery = useQuery({
    queryKey: ["report-catalog"],
    queryFn: () => fetchJson<ReportCatalogResponse>("/api/v1/reports"),
  });

  const availableReports =
    catalogQuery.data?.reports.filter((report) => report.status === "available") ?? [];
  const blockedReports =
    catalogQuery.data?.reports.filter((report) => report.status === "blocked_by_permissions") ?? [];

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [drillDownFilter, setDrillDownFilter] = useState<{ field: string; value: string } | null>(null);
  const [page, setPage] = useState(1);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [resizingColumn, setResizingColumn] = useState<{
    field: string;
    startX: number;
    startWidth: number;
  } | null>(null);
  const sidebarCollapsed = layoutPreferences.sidebarCollapsed;
  const effectiveReportId = selectedReportId ?? availableReports[0]?.report_id ?? null;
  const deferredReportId = useDeferredValue(effectiveReportId);
  const selectedReport = availableReports.find((report) => report.report_id === deferredReportId);

  const reportQuery = useQuery({
    queryKey: ["report-detail", deferredReportId],
    queryFn: () => fetchJson<ReportResponse>(`/api/v1/reports/${deferredReportId}?limit=120`),
    enabled: Boolean(deferredReportId),
  });

  const relatedReports = availableReports.filter((report) => report.report_id !== deferredReportId);
  const relatedQueries = useQueries({
    queries: relatedReports.map((report) => ({
      queryKey: ["report-detail", report.report_id, "correlation"],
      queryFn: () => fetchJson<ReportResponse>(`/api/v1/reports/${report.report_id}?limit=80`),
      enabled: Boolean(deferredReportId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  useEffect(() => {
    setActiveFilters({});
    setDrillDownFilter(null);
    setPage(1);
    setMobileSidebarOpen(false);
  }, [deferredReportId]);

  const semanticView = useMemo(
    () => getReportSemanticView(deferredReportId ?? "", reportQuery.data?.rows ?? [], locale),
    [deferredReportId, locale, reportQuery.data],
  );
  const filterDefinitions = useMemo(
    () => buildFilterDefinitions(deferredReportId ?? "", reportQuery.data?.rows ?? [], locale),
    [deferredReportId, locale, reportQuery.data],
  );
  const filteredRows = useMemo(
    () => applyReportFilters(reportQuery.data?.rows ?? [], activeFilters),
    [activeFilters, reportQuery.data],
  );
  const tableColumns = useMemo(() => {
    const keys = new Set<string>();
    for (const row of filteredRows) {
      for (const key of Object.keys(row)) {
        keys.add(key);
      }
    }

    return [...keys];
  }, [filteredRows]);
  const hiddenColumns = useMemo(
    () => layoutPreferences.hiddenColumnsByReport[deferredReportId ?? ""] ?? [],
    [deferredReportId, layoutPreferences.hiddenColumnsByReport],
  );
  const columnWidths = useMemo(
    () => layoutPreferences.columnWidthsByReport[deferredReportId ?? ""] ?? {},
    [deferredReportId, layoutPreferences.columnWidthsByReport],
  );
  const pinnedColumns = useMemo(
    () => layoutPreferences.pinnedColumnsByReport[deferredReportId ?? ""] ?? [],
    [deferredReportId, layoutPreferences.pinnedColumnsByReport],
  );
  const sortState = useMemo(
    () => layoutPreferences.sortByReport[deferredReportId ?? ""] ?? null,
    [deferredReportId, layoutPreferences.sortByReport],
  );
  const quickFilters = useMemo(
    () => layoutPreferences.quickFiltersByReport[deferredReportId ?? ""] ?? {},
    [deferredReportId, layoutPreferences.quickFiltersByReport],
  );
  const orderedColumns = useMemo(() => {
    const savedOrder = layoutPreferences.columnOrderByReport[deferredReportId ?? ""] ?? [];
    const existingColumns = savedOrder.filter((column) => tableColumns.includes(column));
    const remainingColumns = tableColumns.filter((column) => !existingColumns.includes(column));

    return [...existingColumns, ...remainingColumns];
  }, [deferredReportId, layoutPreferences.columnOrderByReport, tableColumns]);
  const visibleTableColumns = useMemo(
    () => orderedColumns.filter((column) => !hiddenColumns.includes(column)),
    [hiddenColumns, orderedColumns],
  );
  const orderedVisibleColumns = useMemo(() => {
    const pinnedVisibleColumns = visibleTableColumns.filter((column) => pinnedColumns.includes(column));
    const remainingVisibleColumns = visibleTableColumns.filter((column) => !pinnedColumns.includes(column));
    return [...pinnedVisibleColumns, ...remainingVisibleColumns];
  }, [pinnedColumns, visibleTableColumns]);
  const detailRows = useMemo(() => {
    const quickFilteredRows = filteredRows.filter((row) =>
      Object.entries(quickFilters).every(([field, value]) => {
        if (!value) {
          return true;
        }

        return normalizeString(row[field]).toLowerCase().includes(value.toLowerCase());
      }),
    );

    if (!sortState) {
      return quickFilteredRows;
    }

    return [...quickFilteredRows].sort((leftRow, rightRow) => {
      const comparison = compareValues(leftRow[sortState.field], rightRow[sortState.field]);
      return sortState.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredRows, quickFilters, sortState]);
  const paginatedRows = useMemo(() => paginateRows(detailRows, page, PAGE_SIZE), [detailRows, page]);
  const totalPages = Math.max(1, Math.ceil(detailRows.length / PAGE_SIZE));
  const pinnedOffsets = useMemo(() => {
    let currentOffset = 0;
    const offsets: Record<string, number> = {};

    for (const column of orderedVisibleColumns) {
      if (!pinnedColumns.includes(column)) {
        continue;
      }

      offsets[column] = currentOffset;
      currentOffset += columnWidths[column] ?? DEFAULT_COLUMN_WIDTH;
    }

    return offsets;
  }, [columnWidths, orderedVisibleColumns, pinnedColumns]);
  const crossReportInsights = useMemo(
    () =>
      buildCrossReportInsights(
        deferredReportId ?? "",
        filteredRows,
        relatedReports.map((report, index) => ({
          reportId: report.report_id,
          title: getReportTitle(report.report_id, locale, report.title),
          rows: relatedQueries[index]?.data?.rows ?? [],
        })),
        locale,
      ),
    [deferredReportId, filteredRows, locale, relatedQueries, relatedReports],
  );

  useEffect(() => {
    setPage(1);
  }, [activeFilters, quickFilters, sortState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layoutPreferences));
  }, [layoutPreferences]);

  useEffect(() => {
    if (!resizingColumn || typeof window === "undefined") {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const nextWidth = Math.max(120, resizingColumn.startWidth + (event.clientX - resizingColumn.startX));
      if (!deferredReportId) {
        return;
      }

      setLayoutPreferences((currentPreferences) => ({
        ...currentPreferences,
        columnWidthsByReport: {
          ...currentPreferences.columnWidthsByReport,
          [deferredReportId]: {
            ...(currentPreferences.columnWidthsByReport[deferredReportId] ?? {}),
            [resizingColumn.field]: nextWidth,
          },
        },
      }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [deferredReportId, resizingColumn]);

  const sectionLinks = [
    { id: "report-overview", label: dictionary.sectionOverview },
    { id: "report-filters", label: dictionary.sectionFilters },
    { id: "report-charts", label: dictionary.sectionCharts },
    { id: "report-correlations", label: dictionary.sectionCorrelations },
    { id: "report-cross-report", label: dictionary.sectionCrossReport },
    { id: "report-details", label: dictionary.sectionDetails },
  ];

  function handleFilterChange(field: string, value: string) {
    setActiveFilters((currentFilters) => {
      const nextFilters = { ...currentFilters };

      if (!value) {
        delete nextFilters[field];
      } else {
        nextFilters[field] = value;
      }

      return nextFilters;
    });

    if (drillDownFilter?.field === field && drillDownFilter.value !== value) {
      setDrillDownFilter(null);
    }
  }

  function handleDrillDown(filter: { field: string; value: string }) {
    setDrillDownFilter(filter);
    setActiveFilters((currentFilters) => ({
      ...currentFilters,
      [filter.field]: filter.value,
    }));
    setPage(1);
  }

  function clearFilters() {
    setActiveFilters({});
    setDrillDownFilter(null);
    setPage(1);
  }

  function exportCurrentSlice() {
    const csv = buildCsv(detailRows);
    if (!csv || typeof window === "undefined") {
      return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${deferredReportId ?? "report"}-filtered.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  function updateLayoutPreferences(partialPreferences: Partial<LayoutPreferences>) {
    setLayoutPreferences((currentPreferences) => ({
      ...currentPreferences,
      ...partialPreferences,
    }));
  }

  function toggleColumnVisibility(column: string) {
    if (!deferredReportId) {
      return;
    }

    setLayoutPreferences((currentPreferences) => {
      const currentHiddenColumns = currentPreferences.hiddenColumnsByReport[deferredReportId] ?? [];
      const nextHiddenColumns = currentHiddenColumns.includes(column)
        ? currentHiddenColumns.filter((hiddenColumn) => hiddenColumn !== column)
        : [...currentHiddenColumns, column];

      return {
        ...currentPreferences,
        hiddenColumnsByReport: {
          ...currentPreferences.hiddenColumnsByReport,
          [deferredReportId]: nextHiddenColumns,
        },
      };
    });
  }

  function setColumnOrder(nextOrder: string[]) {
    if (!deferredReportId) {
      return;
    }

    setLayoutPreferences((currentPreferences) => ({
      ...currentPreferences,
      columnOrderByReport: {
        ...currentPreferences.columnOrderByReport,
        [deferredReportId]: nextOrder,
      },
    }));
  }

  function moveColumn(sourceColumn: string, targetColumn: string) {
    if (sourceColumn === targetColumn) {
      return;
    }

    const nextOrder = [...orderedColumns];
    const sourceIndex = nextOrder.indexOf(sourceColumn);
    const targetIndex = nextOrder.indexOf(targetColumn);

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const [movedColumn] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, movedColumn);
    setColumnOrder(nextOrder);
  }

  function showAllColumns() {
    if (!deferredReportId) {
      return;
    }

    setLayoutPreferences((currentPreferences) => ({
      ...currentPreferences,
      hiddenColumnsByReport: {
        ...currentPreferences.hiddenColumnsByReport,
        [deferredReportId]: [],
      },
    }));
  }

  function resetTableLayout() {
    if (!deferredReportId) {
      return;
    }

    setLayoutPreferences((currentPreferences) => ({
      ...currentPreferences,
      tableDensity: "comfortable",
      tableHeaderSize: "medium",
      hiddenColumnsByReport: {
        ...currentPreferences.hiddenColumnsByReport,
        [deferredReportId]: [],
      },
      columnOrderByReport: {
        ...currentPreferences.columnOrderByReport,
        [deferredReportId]: [],
      },
      columnWidthsByReport: {
        ...currentPreferences.columnWidthsByReport,
        [deferredReportId]: {},
      },
      pinnedColumnsByReport: {
        ...currentPreferences.pinnedColumnsByReport,
        [deferredReportId]: [],
      },
      sortByReport: {
        ...currentPreferences.sortByReport,
        [deferredReportId]: null,
      },
      quickFiltersByReport: {
        ...currentPreferences.quickFiltersByReport,
        [deferredReportId]: {},
      },
    }));
  }

  function updateQuickFilter(field: string, value: string) {
    if (!deferredReportId) {
      return;
    }

    setLayoutPreferences((currentPreferences) => ({
      ...currentPreferences,
      quickFiltersByReport: {
        ...currentPreferences.quickFiltersByReport,
        [deferredReportId]: {
          ...(currentPreferences.quickFiltersByReport[deferredReportId] ?? {}),
          [field]: value,
        },
      },
    }));
  }

  function togglePinnedColumn(field: string) {
    if (!deferredReportId) {
      return;
    }

    setLayoutPreferences((currentPreferences) => {
      const currentPinnedColumns = currentPreferences.pinnedColumnsByReport[deferredReportId] ?? [];
      const nextPinnedColumns = currentPinnedColumns.includes(field)
        ? currentPinnedColumns.filter((column) => column !== field)
        : [...currentPinnedColumns, field];

      return {
        ...currentPreferences,
        pinnedColumnsByReport: {
          ...currentPreferences.pinnedColumnsByReport,
          [deferredReportId]: nextPinnedColumns,
        },
      };
    });
  }

  function toggleSort(field: string) {
    if (!deferredReportId) {
      return;
    }

    setLayoutPreferences((currentPreferences) => {
      const currentSort = currentPreferences.sortByReport[deferredReportId];
      let nextSort: SortState | null;

      if (!currentSort || currentSort.field !== field) {
        nextSort = { field, direction: "asc" };
      } else if (currentSort.direction === "asc") {
        nextSort = { field, direction: "desc" };
      } else {
        nextSort = null;
      }

      return {
        ...currentPreferences,
        sortByReport: {
          ...currentPreferences.sortByReport,
          [deferredReportId]: nextSort,
        },
      };
    });
  }

  const useCollapsedSidebar = sidebarCollapsed && !mobileSidebarOpen;
  const sidebarClasses = `explorer-sidebar ${useCollapsedSidebar ? "explorer-sidebar-collapsed" : ""} ${
    mobileSidebarOpen ? "explorer-sidebar-mobile-open" : ""
  }`;

  return (
    <section className="explorer-shell">
      <div className="explorer-topbar">
        <div>
          <p className="eyebrow">{dictionary.specialistTitle}</p>
          <h2>
            {dictionary.reportNavigation}
            <InfoTip content={dictionary.specialistSubtitle} label={dictionary.availableReportsSummaryLabel} />
          </h2>
        </div>
        <div className="explorer-topbar-actions">
          <button
            type="button"
            className="mobile-nav-toggle"
            aria-label={mobileSidebarOpen ? dictionary.closeReportsMenu : dictionary.openReportsMenu}
            aria-expanded={mobileSidebarOpen}
            onClick={() => setMobileSidebarOpen((currentValue) => !currentValue)}
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>
      </div>

      <div className={`explorer-layout ${sidebarCollapsed ? "explorer-layout-collapsed" : ""}`}>
        <aside className={sidebarClasses}>
          <section className="panel sidebar-panel">
            <div className={`sidebar-toolbar ${useCollapsedSidebar ? "sidebar-toolbar-collapsed" : ""}`}>
              <div className="sidebar-toolbar-copy">
                <p className="eyebrow">{dictionary.navigationSummary}</p>
                {useCollapsedSidebar ? (
                  <strong>{availableReports.length}</strong>
                ) : (
                  <h3>
                    {dictionary.availableReports}
                    <InfoTip
                      content={dictionary.availableReportsDescription}
                      label={dictionary.availableReportsSummaryLabel}
                    />
                  </h3>
                )}
              </div>
              <button
                type="button"
                className="shell-toggle"
                aria-label={sidebarCollapsed ? dictionary.expandNavigation : dictionary.collapseNavigation}
                title={sidebarCollapsed ? dictionary.expandNavigation : dictionary.collapseNavigation}
                onClick={() =>
                  updateLayoutPreferences({
                    sidebarCollapsed: !sidebarCollapsed,
                  })
                }
              >
                <span aria-hidden="true">{sidebarCollapsed ? ">" : "<"}</span>
              </button>
            </div>

            {catalogQuery.isLoading ? <p className="status-copy">{dictionary.loadingCatalog}</p> : null}
            {catalogQuery.isError ? <p className="status-copy">{dictionary.loadError}</p> : null}

            <div className={`report-nav-list ${useCollapsedSidebar ? "report-nav-list-collapsed" : ""}`}>
              {availableReports.map((report) => {
                const reportTitle = getReportTitle(report.report_id, locale, report.title);
                const compactLabel = buildCollapsedReportLabel(report.report_id, report.title, locale);

                return (
                  <div
                    key={report.report_id}
                    className={`report-nav-item-shell ${useCollapsedSidebar ? "report-nav-item-shell-collapsed" : ""}`}
                  >
                    {useCollapsedSidebar ? (
                      <button
                        type="button"
                        className={`report-nav-item ${
                          report.report_id === effectiveReportId ? "report-nav-item-active" : ""
                        } report-nav-item-collapsed`}
                        title={`${reportTitle}\nSQL: ${report.sql_file_name}\n${dictionary.statusAvailable}`}
                        aria-label={reportTitle}
                        onClick={() => {
                          setSelectedReportId(report.report_id);
                          setMobileSidebarOpen(false);
                        }}
                      >
                        <div className="report-nav-item-compact">
                          <strong>{compactLabel}</strong>
                          <span className="status-pill status-available">{availableReports.indexOf(report) + 1}</span>
                        </div>
                      </button>
                    ) : (
                      <article
                        role="button"
                        tabIndex={0}
                        className={`report-nav-item ${
                          report.report_id === effectiveReportId ? "report-nav-item-active" : ""
                        }`}
                        aria-label={reportTitle}
                        onClick={() => {
                          setSelectedReportId(report.report_id);
                          setMobileSidebarOpen(false);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedReportId(report.report_id);
                            setMobileSidebarOpen(false);
                          }
                        }}
                      >
                        <div className="report-nav-copy">
                          <div className="report-nav-title-row">
                            <strong>{reportTitle}</strong>
                            <InfoTip
                              content={`${dictionary.sqlSourceLabel}: ${report.sql_file_name} | ${dictionary.statusAvailable}`}
                              label={reportTitle}
                            />
                          </div>
                          <span className="status-pill status-available report-nav-status-inline">
                            {dictionary.statusAvailable}
                          </span>
                        </div>
                      </article>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className={`panel ${useCollapsedSidebar ? "panel-collapsed-summary" : ""}`}>
            <div className="panel-header">
              <h3>
                {dictionary.blockedReports}
                {!useCollapsedSidebar ? (
                  <InfoTip
                    content={dictionary.blockedReportsDescription}
                    label={dictionary.blockedReportsSummaryLabel}
                  />
                ) : null}
              </h3>
            </div>
            <div className={`blocked-list ${useCollapsedSidebar ? "blocked-list-collapsed" : ""}`}>
              {blockedReports.map((report) => {
                const reportTitle = getReportTitle(report.report_id, locale, report.title);
                const compactLabel = buildCollapsedReportLabel(report.report_id, report.title, locale);

                return useCollapsedSidebar ? (
                  <button
                    type="button"
                    className="blocked-card blocked-card-collapsed"
                    key={report.report_id}
                    title={`${reportTitle}\nSQL: ${report.sql_file_name}\n${report.blocked_reason ?? dictionary.statusBlocked}`}
                    aria-label={reportTitle}
                  >
                    <div className="report-nav-item-compact">
                      <strong>{compactLabel}</strong>
                      <span className="status-pill status-blocked">!</span>
                    </div>
                  </button>
                ) : (
                  <div className="report-nav-item-shell" key={report.report_id}>
                    <article className="blocked-card">
                      <div className="report-nav-copy blocked-card-copy">
                        <div className="report-nav-title-row">
                          <strong>{reportTitle}</strong>
                          <InfoTip
                            content={`${dictionary.sqlSourceLabel}: ${report.sql_file_name} | ${
                              report.blocked_reason ?? dictionary.statusBlocked
                            }`}
                            label={reportTitle}
                          />
                        </div>
                        <span className="status-pill status-blocked report-nav-status-inline">
                          {dictionary.statusBlocked}
                        </span>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <section className="explorer-main">
          <nav className="section-nav panel" aria-label={dictionary.sectionNavLabel}>
            {sectionLinks.map((sectionLink) => (
              <a key={sectionLink.id} className="section-nav-link" href={`#${sectionLink.id}`}>
                {sectionLink.label}
              </a>
            ))}
          </nav>

          <section id="report-overview" className="hero-panel hero-panel-compact">
            <p className="eyebrow">{dictionary.overviewSectionTitle}</p>
            <h3>
              {selectedReport
                ? getReportTitle(selectedReport.report_id, locale, selectedReport.title)
                : dictionary.selectReportHint}{" "}
              {selectedReport ? (
                <InfoTip
                  content={`${semanticView.overview} | ${dictionary.sqlSourceLabel}: ${selectedReport.sql_file_name}`}
                  label={dictionary.overviewSectionTitle}
                />
              ) : null}
            </h3>
          </section>

          {reportQuery.isLoading ? <p className="status-copy">{dictionary.loadingPreview}</p> : null}
          {reportQuery.isError ? <p className="status-copy">{dictionary.previewUnavailable}</p> : null}

          {reportQuery.data ? (
            <>
              <section className="panel">
                <div className="panel-header">
                  <h3>{dictionary.kpiSectionTitle}</h3>
                  <p>
                    {dictionary.rowCount}: {reportQuery.data.row_count} | {dictionary.filteredRows}:{" "}
                    {filteredRows.length}
                  </p>
                </div>
                <div className="kpi-grid">
                  {semanticView.kpis.map((kpi) => (
                    <article className="kpi-card" key={kpi.id}>
                      <p className="kpi-label">
                        {kpi.label}
                        <InfoTip content={`${kpi.tooltip} | ${kpi.detail}`} label={kpi.label} />
                      </p>
                      <strong className="kpi-value">{kpi.value}</strong>
                    </article>
                  ))}
                </div>
              </section>

              <section id="report-filters" className="panel">
                <div className="panel-header">
                  <h3>
                    {dictionary.filterSectionTitle}
                    <InfoTip content={dictionary.filterSectionDescription} label={dictionary.filterSectionTitle} />
                  </h3>
                </div>
                <div className="filters-grid">
                  {filterDefinitions.map((filter) => (
                    <label className="filter-field" key={filter.field}>
                      <span>
                        {filter.label}
                        <InfoTip
                          content={`${filter.description || filter.label} | ${dictionary.technicalFieldLabel}: ${filter.field} | ${dictionary.dataSourceLabel}: ${
                            filter.source
                          }`}
                          label={filter.label}
                        />
                      </span>
                      <select
                        value={activeFilters[filter.field] ?? ""}
                        onChange={(event) => handleFilterChange(filter.field, event.target.value)}
                      >
                        <option value="">{dictionary.filterPlaceholder}</option>
                        {filter.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <div className="toolbar-row">
                  <button type="button" className="secondary-button" onClick={clearFilters}>
                    {dictionary.clearFilters}
                  </button>
                  {drillDownFilter ? (
                    <div className="filter-chip">
                      <strong>{dictionary.drillDownApplied}</strong>
                      <span>
                        {getFieldMeta(deferredReportId ?? "", drillDownFilter.field)?.label[locale] ??
                          drillDownFilter.field}
                        : {drillDownFilter.value}
                      </span>
                      <button type="button" onClick={() => handleFilterChange(drillDownFilter.field, "")}>
                        {dictionary.clearDrillDown}
                      </button>
                    </div>
                  ) : null}
                </div>
              </section>

              <section id="report-charts" className="panel">
                <div className="panel-header">
                  <h3>{dictionary.chartSectionTitle}</h3>
                  <p>{dictionary.reportNavigationDescription}</p>
                </div>
                <div className="chart-grid">
                  {semanticView.charts.map((suggestion) => (
                    <ReportCharts
                      reportId={deferredReportId ?? ""}
                      key={`${deferredReportId ?? "unknown"}-${suggestion.id}`}
                      rows={filteredRows}
                      suggestion={suggestion}
                      labels={dictionary}
                      locale={locale}
                      onDrillDown={handleDrillDown}
                    />
                  ))}
                </div>
              </section>

              <section id="report-correlations" className="panel two-column-panel">
                <div>
                  <div className="panel-header">
                    <h3>{dictionary.correlationSectionTitle}</h3>
                    <p>{dictionary.specialistSubtitle}</p>
                  </div>
                  <CorrelationList
                    reportId={deferredReportId ?? ""}
                    locale={locale}
                    suggestions={semanticView.correlations}
                  />
                </div>
                <SampleRecord
                  reportId={deferredReportId ?? ""}
                  row={filteredRows[0]}
                  locale={locale}
                />
              </section>

              <section id="report-cross-report" className="panel">
                <div className="panel-header">
                  <h3>{dictionary.correlationAcrossReportsTitle}</h3>
                  <p>{dictionary.correlationAcrossReportsDescription}</p>
                </div>
                <div className="cross-report-grid">
                  {crossReportInsights.map((insight) => (
                    <article className="cross-report-card" key={insight.id}>
                      <p className="eyebrow">{insight.relatedReportTitle}</p>
                      <h4>{insight.conceptLabel}</h4>
                      <p>{insight.summary}</p>
                      <p className="cross-report-values">
                        {dictionary.sharedValues}: {insight.overlapValues.join(", ")}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section id="report-details" className="panel">
                <div className="panel-header">
                  <h3>
                    {dictionary.detailSectionTitle}
                    <InfoTip
                      content={`${dictionary.detailSectionDescription} | ${dictionary.currentReportLabel}: ${
                        deferredReportId ?? "-"
                      } | ${dictionary.sqlSourceLabel}: ${selectedReport?.sql_file_name ?? "-"}`}
                      label={dictionary.reportContextSummaryLabel}
                    />
                  </h3>
                </div>
                <div className="detail-controls">
                  <div className="column-visibility-panel">
                    <p className="detail-controls-title">{dictionary.columnControlsTitle}</p>
                    <p className="status-copy">{dictionary.dragToReorder}</p>
                    <div className="column-chip-list" aria-label={dictionary.visibleColumnsLabel}>
                      {orderedColumns.map((column) => {
                        const isVisible = visibleTableColumns.includes(column);
                        const columnMeta = getFieldMeta(deferredReportId ?? "", column);
                        const columnLabel = columnMeta?.label[locale] ?? column;
                        const columnSource = columnMeta?.source ?? column;

                        return (
                          <button
                            type="button"
                            key={column}
                            className={`column-chip ${isVisible ? "column-chip-active" : ""}`}
                            aria-pressed={isVisible}
                            title={columnSource}
                            aria-label={`${
                              isVisible ? dictionary.hideColumn : dictionary.showColumn
                            } ${column} (${columnLabel})`}
                            draggable
                            onDragStart={() => setDraggedColumn(column)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => {
                              if (draggedColumn) {
                                moveColumn(draggedColumn, column);
                              }
                              setDraggedColumn(null);
                            }}
                            onDragEnd={() => setDraggedColumn(null)}
                            onClick={() => toggleColumnVisibility(column)}
                          >
                            {columnLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="quick-filters-panel">
                    <p className="detail-controls-title">{dictionary.quickFiltersTitle}</p>
                    <div className="quick-filter-grid">
                      {orderedVisibleColumns.slice(0, 6).map((column) => {
                        const columnMeta = getFieldMeta(deferredReportId ?? "", column);
                        const columnLabel = columnMeta?.label[locale] ?? column;

                        return (
                          <label className="filter-field" key={`${column}-quick-filter`}>
                            <span>{columnLabel}</span>
                            <input
                              className="quick-filter-input"
                              type="text"
                              value={quickFilters[column] ?? ""}
                              placeholder={dictionary.filterPlaceholder}
                              onChange={(event) => updateQuickFilter(column, event.target.value)}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="toolbar-row">
                  <p className="status-copy">
                    {dictionary.activeFilters}: {Object.keys(activeFilters).length} | {dictionary.filteredRows}:{" "}
                    {detailRows.length}
                  </p>
                  <div className="detail-action-group">
                    <button type="button" className="secondary-button" onClick={showAllColumns}>
                      {dictionary.showAllColumns}
                    </button>
                    <button type="button" className="secondary-button" onClick={resetTableLayout}>
                      {dictionary.resetTableLayout}
                    </button>
                    <button type="button" className="secondary-button" onClick={exportCurrentSlice}>
                      {dictionary.exportCsv}
                    </button>
                  </div>
                </div>
                <div className="table-shell">
                  <table
                    className={`detail-table detail-table-${layoutPreferences.tableDensity} detail-table-header-${layoutPreferences.tableHeaderSize}`}
                  >
                    <thead>
                      <tr>
                        {orderedVisibleColumns.map((column) => (
                          <th
                            key={column}
                            aria-label={column}
                            className={pinnedColumns.includes(column) ? "pinned-column" : ""}
                            style={{
                              width: `${columnWidths[column] ?? DEFAULT_COLUMN_WIDTH}px`,
                              minWidth: `${columnWidths[column] ?? DEFAULT_COLUMN_WIDTH}px`,
                              ...(pinnedColumns.includes(column)
                                ? { left: `${pinnedOffsets[column] ?? 0}px` }
                                : {}),
                            }}
                            draggable
                            onDragStart={() => setDraggedColumn(column)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => {
                              if (draggedColumn) {
                                moveColumn(draggedColumn, column);
                              }
                              setDraggedColumn(null);
                            }}
                            onDragEnd={() => setDraggedColumn(null)}
                          >
                            {(() => {
                              const columnMeta = getFieldMeta(deferredReportId ?? "", column);
                              const columnLabel = columnMeta?.label[locale] ?? column;
                              const columnHelp = `${columnMeta?.description[locale] ?? columnLabel} Fonte: ${
                                columnMeta?.source ?? column
                              }`;

                              return (
                            <div className="th-content">
                              <button
                                type="button"
                                className="column-sort-button"
                                title={columnHelp}
                                onClick={() => toggleSort(column)}
                              >
                                <span>{columnLabel}</span>
                                {sortState?.field === column ? (
                                  <span className="sort-indicator">
                                    {sortState.direction === "asc" ? "↑" : "↓"}
                                  </span>
                                ) : null}
                              </button>
                              <button
                                type="button"
                                className={`column-pin-button ${
                                  pinnedColumns.includes(column) ? "column-pin-button-active" : ""
                                }`}
                                aria-label={`${
                                  pinnedColumns.includes(column)
                                    ? dictionary.unpinColumn
                                    : dictionary.pinColumn
                                } ${columnLabel}`}
                                title={columnHelp}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  togglePinnedColumn(column);
                                }}
                              >
                                {pinnedColumns.includes(column) ? "P" : "P"}
                              </button>
                              <button
                                type="button"
                                className="column-resize-handle"
                                aria-label={`${dictionary.resizeColumn} ${columnLabel}`}
                                title={columnHelp}
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  const headerCell = event.currentTarget.closest("th");
                                  const startWidth =
                                    headerCell?.getBoundingClientRect().width ?? DEFAULT_COLUMN_WIDTH;
                                  setResizingColumn({
                                    field: column,
                                    startX: event.clientX,
                                    startWidth,
                                  });
                                }}
                              />
                            </div>
                              );
                            })()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((row, index) => (
                        <tr key={`${page}-${index}`}>
                          {orderedVisibleColumns.map((column) => (
                            <td
                              key={column}
                              className={pinnedColumns.includes(column) ? "pinned-column" : ""}
                              style={
                                pinnedColumns.includes(column)
                                  ? { left: `${pinnedOffsets[column] ?? 0}px` }
                                  : undefined
                              }
                            >
                              <span
                                className="table-cell-clamp"
                                title={
                                  row[column] === null || row[column] === undefined || row[column] === ""
                                    ? "-"
                                    : String(row[column])
                                }
                              >
                                {row[column] === null || row[column] === undefined || row[column] === ""
                                  ? "-"
                                  : String(row[column])}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pagination-row">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={page <= 1}
                    onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  >
                    {dictionary.previousPage}
                  </button>
                  <span>
                    {dictionary.pageLabel} {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                  >
                    {dictionary.nextPage}
                  </button>
                </div>
              </section>
            </>
          ) : null}
        </section>
      </div>
    </section>
  );
}
