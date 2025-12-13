"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchKnowledges, type Knowledge } from "@/lib/api/knowledge";
import { DataTable, ColumnConfig } from "@/components/Table";
import { ColumnDef } from "@tanstack/react-table";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { formatDate } from "@/lib/utils/dateUtils";

// 默认列配置
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "code", label: "代码", visible: true },
  { key: "name", label: "名称", visible: true },
  { key: "description", label: "描述", visible: true },
  { key: "created_at", label: "创建时间", visible: true },
  { key: "updated_at", label: "更新时间", visible: true },
];

const STORAGE_KEY = "knowledges_table_columns";

export function KnowledgeTable() {
  const {
    data: knowledges = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["knowledges"],
    queryFn: fetchKnowledges,
  });

  const error = queryError ? getErrorMessage(queryError) : null;

  // 定义列
  const columns = useMemo<ColumnDef<Knowledge>[]>(
    () => [
      {
        accessorKey: "code",
        header: "代码",
        cell: ({ row }) => (
          <span className="font-mono">{row.getValue("code")}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "名称",
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("name")}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "描述",
        cell: ({ row }) => (
          <span className="max-w-md truncate block">
            {row.getValue("description")}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "创建时间",
        cell: ({ row }) => {
          const date = row.getValue("created_at") as string;
          return formatDate(date, "YYYY-MM-DD");
        },
      },
      {
        accessorKey: "updated_at",
        header: "更新时间",
        cell: ({ row }) => {
          const date = row.getValue("updated_at") as string;
          return formatDate(date, "YYYY-MM-DD");
        },
      },
    ],
    []
  );

  return (
    <DataTable
      data={knowledges}
      columns={columns}
      loading={loading}
      error={error}
      pagination={{ enabled: true, pageSize: 10 }}
      columnSettings={{
        enabled: true,
        storageKey: STORAGE_KEY,
        defaultColumns: DEFAULT_COLUMNS,
      }}
      sorting={{ enabled: true }}
      emptyMessage="暂无数据"
      refreshButton={{
        onClick: () => refetch(),
        loading: loading,
      }}
    />
  );
}

