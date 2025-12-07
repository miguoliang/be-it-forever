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
}

export function DataTable<TData>({
  data,
  columns,
  loading = false,
  error = null,
  pagination = { enabled: true, pageSize: 10 },
  columnSettings,
  sorting = { enabled: true },
  emptyMessage = "暂无数据",
}: DataTableProps<TData>) {
  const [sortingState, setSortingState] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pagination.pageSize || 10,
  });

  // 从 columns 生成列配置的辅助函数
  const generateColumnConfigs = useMemo(() => {
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

  // 列设置状态 - 如果没有提供 defaultColumns，从 columns 中生成
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(() => {
    if (columnSettings?.enabled) {
      if (columnSettings.defaultColumns && columnSettings.defaultColumns.length > 0) {
        // 如果有默认列配置，使用它
        if (typeof window !== "undefined" && columnSettings.storageKey) {
          const saved = localStorage.getItem(columnSettings.storageKey);
          if (saved) {
            try {
              return JSON.parse(saved);
            } catch {
              return columnSettings.defaultColumns;
            }
          }
        }
        return columnSettings.defaultColumns;
      } else {
        // 如果没有默认列配置，从 columns 中生成
        const generatedConfigs: ColumnConfig[] = columns.map((col) => {
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

        if (typeof window !== "undefined" && columnSettings.storageKey) {
          const saved = localStorage.getItem(columnSettings.storageKey);
          if (saved) {
            try {
              return JSON.parse(saved);
            } catch {
              return generatedConfigs;
            }
          }
        }
        return generatedConfigs;
      }
    }
    return [];
  });

  // 当 columns 变化时，更新列配置（如果没有 defaultColumns 且列配置为空）
  useEffect(() => {
    if (
      columnSettings?.enabled &&
      (!columnSettings.defaultColumns || columnSettings.defaultColumns.length === 0) &&
      columnConfigs.length === 0 &&
      generateColumnConfigs.length > 0
    ) {
      setColumnConfigs(generateColumnConfigs);
    }
  }, [columns, columnSettings, generateColumnConfigs, columnConfigs.length]);

  // 保存列设置到 localStorage
  useEffect(() => {
    if (
      columnSettings?.enabled &&
      columnSettings?.storageKey &&
      columnConfigs.length > 0
    ) {
      localStorage.setItem(
        columnSettings.storageKey,
        JSON.stringify(columnConfigs)
      );
    }
  }, [columnConfigs, columnSettings]);

  // 根据列设置更新列可见性
  useEffect(() => {
    if (columnSettings?.enabled && columnConfigs.length > 0) {
      const visibility: VisibilityState = {};
      columnConfigs.forEach((config) => {
        visibility[config.key] = config.visible;
      });
      setColumnVisibility(visibility);
    }
  }, [columnConfigs, columnSettings]);

  // 转换列配置为 TanStack Table 的列定义格式
  const tableColumns = useMemo(() => {
    if (columnSettings?.enabled && columnConfigs.length > 0) {
      // 根据列配置过滤和排序列
      const configMap = new Map(
        columnConfigs.map((config) => [config.key, config])
      );
      return columns.filter((col) => {
        // 安全地访问 accessorKey，因为 ColumnDef 是联合类型
        const accessorKey =
          "accessorKey" in col && typeof col.accessorKey === "string"
            ? col.accessorKey
            : undefined;
        const colId = (col.id as string | undefined) || accessorKey || "";
        const config = configMap.get(colId);
        // 如果配置中没有找到该列，默认显示
        if (!config) return true;
        return config.visible !== false;
      });
    }
    return columns;
  }, [columns, columnConfigs, columnSettings]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination.enabled
      ? getPaginationRowModel()
      : undefined,
    getSortedRowModel: sorting.enabled ? getSortedRowModel() : undefined,
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
    manualPagination: false, // 客户端分页
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

  const totalPages = Math.ceil(data.length / (pagination.pageSize || 10));
  const currentPage = paginationState.pageIndex + 1;

  return (
    <div className="space-y-4">
      {columnSettings?.enabled && (
        <div className="flex justify-end">
          <ColumnSettings
            columns={columnConfigs}
            onColumnsChange={setColumnConfigs}
          />
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          sorting.enabled && header.column.getCanSort()
                            ? "cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                            : ""
                        }`}
                        onClick={
                          sorting.enabled && header.column.getCanSort()
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {sorting.enabled &&
                          header.column.getCanSort() &&
                          (() => {
                            const sorted = header.column.getIsSorted();
                            if (sorted === false) return null;
                            return (
                              <span className="text-gray-400">
                                {sorted === "asc" ? " ↑" : sorted === "desc" ? " ↓" : " ↕"}
                              </span>
                            );
                          })()}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={tableColumns.length}
                  className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination.enabled &&
        data.length > 0 &&
        totalPages > 1 &&
        table.getPageCount() > 1 && (
          <Paginator
            currentPage={currentPage}
            totalPages={table.getPageCount()}
            onPageChange={(page) => table.setPageIndex(page - 1)}
            itemsPerPage={pagination.pageSize || 10}
            totalItems={data.length}
          />
        )}
      </div>
    </div>
  );
}

// 导出列设置组件供外部使用
export { ColumnSettings };
export type { ColumnConfig };

