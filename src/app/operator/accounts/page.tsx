"use client";

import { useEffect, useState, useMemo } from "react";
import { useOperatorAuth } from "../import/hooks/useOperatorAuth";
import { DataTable, ColumnConfig } from "@/components/Table";
import { ColumnDef } from "@tanstack/react-table";

interface Account {
  id: number;
  username: string;
  email?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

// 默认列配置
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "id", label: "ID", visible: true },
  { key: "username", label: "用户名", visible: true },
  { key: "email", label: "邮箱", visible: true },
  { key: "role", label: "角色", visible: true },
  { key: "created_at", label: "创建时间", visible: true },
  { key: "actions", label: "操作", visible: true },
];

const STORAGE_KEY = "accounts_table_columns";

export default function AccountsPage() {
  useOperatorAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/accounts");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "获取账户列表失败");
      }
      const data = await res.json();
      // 处理返回的数据可能是数组或包含 accounts 字段的对象
      const accountsList = Array.isArray(data) ? data : data.accounts || [];
      setAccounts(accountsList);
    } catch (err: any) {
      setError(err.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  // 定义列
  const columns = useMemo<ColumnDef<Account>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono">{row.getValue("id")}</span>
        ),
      },
      {
        accessorKey: "username",
        header: "用户名",
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("username")}</span>
        ),
      },
      {
        accessorKey: "email",
        header: "邮箱",
        cell: ({ row }) => row.getValue("email") || "-",
      },
      {
        accessorKey: "role",
        header: "角色",
        cell: ({ row }) => {
          const role = (row.getValue("role") as string)?.trim() || "learner";
          return (
            <span
              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                role === "operator"
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {role}
            </span>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "创建时间",
        cell: ({ row }) => {
          const date = row.getValue("created_at") as string;
          return new Date(date).toLocaleString("zh-CN");
        },
      },
      {
        id: "actions",
        header: "操作",
        cell: () => (
          <button className="text-primary hover:text-primary/80">
            查看详情
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          账户管理
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          查看和管理所有用户账户
        </p>
      </div>

      <DataTable
        data={accounts}
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
      />
    </div>
  );
}

