"use client";

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
} from "@tanstack/react-table";
import { useState, useEffect, useMemo } from "react";
import { Paginator } from "@/app/operator/import/components/Paginator";
import { ColumnSettings } from "@/app/operator/accounts/components/ColumnSettings";
import type { ColumnConfig } from "@/app/operator/accounts/components/ColumnSettings";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  loading?: boolean;
  error?: string | null;
  // 分页配置
  pagination?: {
    enabled: boolean;
    pageSize?: number;
  };
  // 列设置配置
  columnSettings?: {
    enabled: boolean;
    storageKey?: string;
    defaultColumns?: ColumnConfig[];
  };
  // 排序配置
  sorting?: {
    enabled: boolean;
  };
  // 空数据提示
  emptyMessage?: string;
  // 自定义行样式
  getRowClassName?: (row: TData) => string;
  // 刷新按钮配置
  refreshButton?: {
    onClick: () => void;
    loading?: boolean;
  };
}

export const DataTable = <TData,>({
  data,
  columns,
  loading = false,
  error = null,
  pagination = { enabled: true, pageSize: 10 },
  columnSettings,
  sorting = { enabled: true },
  emptyMessage = "暂无数据",
  getRowClassName,
  refreshButton,
}: DataTableProps<TData>) => {
  // Destructure with safe defaults to avoid repetitive optional chaining
  const { enabled: paginationEnabled = true, pageSize: initialPageSize = 10 } = pagination || {};
  const { enabled: columnsEnabled = false, defaultColumns } = columnSettings || {};
  const { enabled: sortingEnabled = true } = sorting || {};

  const [sortingState, setSortingState] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  // Helper: Generate column configs from current columns
  const generatedConfigs = useMemo(() => {
    return columns.map((col) => {
      const accessorKey =
        "accessorKey" in col && typeof col.accessorKey === "string"
          ? col.accessorKey
          : undefined;
      const colId = (col.id as string | undefined) || accessorKey || "";
      const header =
        typeof col.header === "string"
          ? col.header
          : col.header
          ? String(col.header)
          : colId;
      return {
        key: colId,
        label: header,
        visible: true,
      };
    });
  }, [columns]);

  // Initialize or update column configs
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(() => 
    (columnsEnabled && defaultColumns && defaultColumns.length > 0) ? defaultColumns : []
  );

  // Sync column configs when columns change, if strictly necessary and not overridden
  useEffect(() => {
    if (columnsEnabled && (!defaultColumns || defaultColumns.length === 0) && columnConfigs.length === 0 && generatedConfigs.length > 0) {
      setColumnConfigs(generatedConfigs);
    }
  }, [columnsEnabled, defaultColumns, columnConfigs.length, generatedConfigs]);

  // Sync visibility with configs
  useEffect(() => {
    if (columnsEnabled && columnConfigs.length > 0) {
      const visibility: VisibilityState = {};
      columnConfigs.forEach((config) => {
        visibility[config.key] = config.visible;
      });
      setColumnVisibility(visibility);
    }
  }, [columnConfigs, columnsEnabled]);

  // Filter columns based on visibility settings
  const tableColumns = useMemo(() => {
    if (columnsEnabled && columnConfigs.length > 0) {
      const configMap = new Map(columnConfigs.map((config) => [config.key, config]));
      return columns.filter((col) => {
        const accessorKey = "accessorKey" in col && typeof col.accessorKey === "string" ? col.accessorKey : undefined;
        const colId = (col.id as string | undefined) || accessorKey || "";
        const config = configMap.get(colId);
        return config ? config.visible !== false : true;
      });
    }
    return columns;
  }, [columns, columnConfigs, columnsEnabled]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: paginationEnabled ? getPaginationRowModel() : undefined,
    getSortedRowModel: sortingEnabled ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSortingState,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPaginationState,
    state: {
      sorting: sortingState,
      columnFilters,
      columnVisibility,
      pagination: paginationState,
    },
    manualPagination: false,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.length / initialPageSize);
  const currentPage = paginationState.pageIndex + 1;

  return (
    <div className="space-y-4">
      {(columnsEnabled || refreshButton) && (
        <div className="flex justify-end gap-2">
          {refreshButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshButton.onClick}
              disabled={refreshButton.loading || loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshButton.loading || loading ? "animate-spin" : ""}`} />
              刷新
            </Button>
          )}
          {columnsEnabled && (
            <ColumnSettings
              columns={columnConfigs}
              onColumnsChange={setColumnConfigs}
            />
          )}
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          sortingEnabled && header.column.getCanSort()
                            ? "cursor-pointer select-none hover:text-foreground"
                            : ""
                        }`}
                        onClick={
                          sortingEnabled && header.column.getCanSort()
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {sortingEnabled &&
                          header.column.getCanSort() &&
                          (() => {
                            const sorted = header.column.getIsSorted();
                            if (sorted === false) return null;
                            return (
                              <span className="text-muted-foreground">
                                {sorted === "asc" ? " ↑" : sorted === "desc" ? " ↓" : " ↕"}
                              </span>
                            );
                          })()}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const rowData = row.original;
                const rowClassName = getRowClassName ? getRowClassName(rowData) : "";
                return (
                  <TableRow key={row.id} className={rowClassName}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {paginationEnabled &&
        data.length > 0 &&
        totalPages > 1 &&
        table.getPageCount() > 1 && (
          <Paginator
            currentPage={currentPage}
            totalPages={table.getPageCount()}
            onPageChange={(page) => table.setPageIndex(page - 1)}
            itemsPerPage={initialPageSize}
            totalItems={data.length}
          />
        )}
      </div>
    </div>
  );
};

// 导出列设置组件供外部使用
export { ColumnSettings };
export type { ColumnConfig };

