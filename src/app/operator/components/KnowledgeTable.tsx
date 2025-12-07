"use client";

import { useEffect, useState, useMemo } from "react";
import { DataTable, ColumnConfig } from "@/components/Table";
import { ColumnDef } from "@tanstack/react-table";

interface KnowledgeMetadata {
  phonetic?: string;
  [key: string]: unknown;
}

interface Knowledge {
  code: string;
  name: string;
  description: string;
  metadata: KnowledgeMetadata;
  created_at: string;
  updated_at: string;
}

// 默认列配置
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "code", label: "代码", visible: true },
  { key: "name", label: "名称", visible: true },
  { key: "description", label: "描述", visible: true },
  { key: "metadata", label: "音标", visible: true },
  { key: "created_at", label: "创建时间", visible: true },
  { key: "updated_at", label: "更新时间", visible: true },
];

const STORAGE_KEY = "knowledges_table_columns";

export function KnowledgeTable() {
  const [knowledges, setKnowledges] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKnowledges = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/knowledge");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError("权限不足");
          return;
        }
        setError("加载失败");
        return;
      }
      const data = await res.json();
      setKnowledges(data);
    } catch (err) {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledges();
  }, []);

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
        accessorKey: "metadata",
        header: "音标",
        cell: ({ row }) => {
          const metadata = row.getValue("metadata") as KnowledgeMetadata;
          const phonetic = metadata?.phonetic;
          const name = row.original.name;

          if (!phonetic) return "-";

          return (
            <div className="flex items-center gap-2">
              <span>{phonetic}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if ("speechSynthesis" in window && name) {
                    window.speechSynthesis.cancel();
                    const utter = new SpeechSynthesisUtterance(name);
                    utter.lang = "en-US";
                    utter.rate = 0.8;
                    window.speechSynthesis.speak(utter);
                  }
                }}
                className="p-1.5 text-primary hover:text-primary/80 hover:bg-accent rounded transition-colors"
                aria-label="播放单词"
                title="播放单词"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 .53-.22H15a.75.75 0 0 1 .75.75v15a.75.75 0 0 1-.75.75h-3.25a.75.75 0 0 1-.53-.22l-4.72-4.72H4.5a.75.75 0 0 1-.75-.75V9a.75.75 0 0 1 .75-.75h2.25Z"
                  />
                </svg>
              </button>
            </div>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "创建时间",
        cell: ({ row }) => {
          const date = row.getValue("created_at") as string;
          return new Date(date).toLocaleDateString("zh-CN");
        },
      },
      {
        accessorKey: "updated_at",
        header: "更新时间",
        cell: ({ row }) => {
          const date = row.getValue("updated_at") as string;
          return new Date(date).toLocaleDateString("zh-CN");
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
        onClick: fetchKnowledges,
        loading: loading,
      }}
    />
  );
}

