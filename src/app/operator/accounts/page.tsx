"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAccounts } from "@/lib/api/accounts";
import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { DataTable, ColumnConfig } from "@/components/Table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DistributeCardsDialog } from "./components/DistributeCardsDialog";
import { Paginator } from "../import/components/Paginator";
import { Gift } from "lucide-react";
import { getErrorMessage } from "@/lib/utils/errorUtils";

interface Account {
  id: string; // UUID
  username: string;
  email?: string;
  role?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string | null;
}

// 默认列配置
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "id", label: "ID", visible: false },
  { key: "username", label: "用户名", visible: true },
  { key: "email", label: "邮箱", visible: true },
  { key: "role", label: "角色", visible: true },
  { key: "last_sign_in_at", label: "最后登录", visible: true },
  { key: "created_at", label: "创建时间", visible: true },
  { key: "actions", label: "操作", visible: true },
];

const STORAGE_KEY = "accounts_table_columns";

export default function AccountsPage() {
  useOperatorAuth();
  const [distributeDialogOpen, setDistributeDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const {
    data: accountsData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["accounts", currentPage, perPage],
    queryFn: () => fetchAccounts(currentPage, perPage),
  });

  const accounts = accountsData?.accounts || [];
  const hasMore = accountsData?.pagination?.hasMore || false;
  const error = queryError ? getErrorMessage(queryError) : null;

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
        accessorKey: "last_sign_in_at",
        header: "最后登录",
        cell: ({ row }) => {
          const lastSignIn = row.getValue("last_sign_in_at") as string | null | undefined;
          if (!lastSignIn) {
            return <span className="text-muted-foreground">从未登录</span>;
          }
          return new Date(lastSignIn).toLocaleString("zh-CN");
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
        cell: ({ row }) => {
          const account = row.original;
          const role = (account.role as string)?.trim() || "learner";
          
          // Don't show distribute button for operators
          if (role === "operator") {
            return <span className="text-muted-foreground text-sm">-</span>;
          }
          
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAccount(account);
                setDistributeDialogOpen(true);
              }}
              className="gap-2"
            >
              <Gift className="h-4 w-4" />
              分配卡片
            </Button>
          );
        },
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
        pagination={{ enabled: false }}
        columnSettings={{
          enabled: true,
          storageKey: STORAGE_KEY,
          defaultColumns: DEFAULT_COLUMNS,
        }}
        sorting={{ enabled: true }}
        emptyMessage="暂无数据"
        getRowClassName={(account) => {
          const role = (account.role as string)?.trim() || "learner";
          return role === "operator" 
            ? "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500" 
            : "";
        }}
        refreshButton={{
          onClick: () => refetch(),
          loading: loading,
        }}
      />

      {!loading && accounts.length > 0 && (
        <div className="mt-4">
          <Paginator
            currentPage={currentPage}
            totalPages={hasMore ? currentPage + 1 : currentPage}
            onPageChange={(page) => setCurrentPage(page)}
            itemsPerPage={perPage}
            totalItems={accounts.length}
          />
        </div>
      )}

      {selectedAccount && (
        <DistributeCardsDialog
          open={distributeDialogOpen}
          onOpenChange={setDistributeDialogOpen}
          accountId={selectedAccount.id}
          accountUsername={selectedAccount.username}
          onSuccess={() => {
            // Optionally refresh accounts list
          }}
        />
      )}
    </div>
  );
}

