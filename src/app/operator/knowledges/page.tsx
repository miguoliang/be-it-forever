"use client";

import { KnowledgeTable } from "../components/KnowledgeTable";

export default function KnowledgesPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          单词列表
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          查看和管理所有知识条目
        </p>
      </div>
      <KnowledgeTable />
    </div>
  );
}

