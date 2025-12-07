# DataTable Component

基于 TanStack Table 的通用表格组件，支持排序、分页、列设置等功能。

## 安装依赖

```bash
npm install @tanstack/react-table
```

## 使用方法

### 基础示例

```tsx
import { DataTable } from "@/components/Table";
import { ColumnDef } from "@tanstack/react-table";

interface User {
  id: number;
  name: string;
  email: string;
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "姓名",
  },
  {
    accessorKey: "email",
    header: "邮箱",
  },
];

function UsersPage() {
  const data: User[] = [
    { id: 1, name: "张三", email: "zhang@example.com" },
    { id: 2, name: "李四", email: "li@example.com" },
  ];

  return <DataTable data={data} columns={columns} />;
}
```

### 带列设置的示例

```tsx
import { DataTable, ColumnConfig } from "@/components/Table";

const defaultColumns: ColumnConfig[] = [
  { key: "id", label: "ID", visible: true },
  { key: "name", label: "姓名", visible: true },
  { key: "email", label: "邮箱", visible: true },
];

<DataTable
  data={data}
  columns={columns}
  columnSettings={{
    enabled: true,
    storageKey: "users_table_columns",
    defaultColumns: defaultColumns,
  }}
/>
```

### 自定义单元格渲染

```tsx
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "role",
    header: "角色",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <span
          className={`px-2 py-1 rounded-full ${
            role === "admin"
              ? "bg-purple-100 text-purple-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {role}
        </span>
      );
    },
  },
];
```

### 禁用分页

```tsx
<DataTable
  data={data}
  columns={columns}
  pagination={{ enabled: false }}
/>
```

## Props

- `data`: 表格数据数组
- `columns`: TanStack Table 列定义数组
- `loading?`: 加载状态
- `error?`: 错误信息
- `pagination?`: 分页配置
  - `enabled`: 是否启用分页（默认 true）
  - `pageSize`: 每页显示数量（默认 10）
- `columnSettings?`: 列设置配置
  - `enabled`: 是否启用列设置
  - `storageKey`: localStorage 存储键
  - `defaultColumns`: 默认列配置
- `sorting?`: 排序配置
  - `enabled`: 是否启用排序（默认 true）
- `emptyMessage?`: 空数据提示文字（默认 "暂无数据"）

## 特性

- ✅ 客户端分页
- ✅ 列排序
- ✅ 列显示/隐藏（带 localStorage 持久化）
- ✅ 响应式设计
- ✅ 深色模式支持
- ✅ TypeScript 类型安全
- ✅ 自定义单元格渲染
- ✅ 空状态处理
- ✅ 加载状态处理

