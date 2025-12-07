"use client";

import { useMemo } from "react";
import { CSVData } from "../hooks/useCSVParser";
import { WordData } from "../types";
import { DataTable, ColumnConfig } from "@/components/Table";
import { ColumnDef } from "@tanstack/react-table";

interface PreviewTableProps {
  data: CSVData;
}

// 默认列配置
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "name", label: "单词", visible: true },
  { key: "description", label: "翻译", visible: true },
  { key: "pos", label: "词性", visible: true },
  { key: "level", label: "等级", visible: true },
  { key: "example", label: "例句", visible: true },
];

const STORAGE_KEY = "import_preview_table_columns";

export function PreviewTable({ data }: PreviewTableProps) {
  // 定义列
  const columns = useMemo<ColumnDef<WordData>[]>(
    () => [
      {
        accessorKey: "name",
        header: "单词",
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("name") || "-"}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "翻译",
        cell: ({ row }) => row.getValue("description") || "-",
      },
      {
        id: "pos",
        header: "词性",
        cell: ({ row }) => {
          const metadata = row.original.metadata || {};
          return metadata.pos || "-";
        },
      },
      {
        id: "level",
        header: "等级",
        cell: ({ row }) => {
          const metadata = row.original.metadata || {};
          return metadata.level || "-";
        },
      },
      {
        id: "example",
        header: "例句",
        cell: ({ row }) => {
          const metadata = row.original.metadata || {};
          return (
            <span className="max-w-md block">{metadata.example || "-"}</span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="mb-6 md:mb-8">
      <DataTable
        data={data.rows}
        columns={columns}
        loading={false}
        error={null}
        pagination={{ enabled: true, pageSize: 10 }}
        columnSettings={{
          enabled: true,
          storageKey: STORAGE_KEY,
          defaultColumns: DEFAULT_COLUMNS,
        }}
        sorting={{ enabled: true }}
        emptyMessage="暂无数据"
      />
    </div>
  );
}

