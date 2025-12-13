"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useOperatorAuth } from "../../hooks/useOperatorAuth";
import { useWordImport } from "../hooks/useWordImport";
import { PreviewTable } from "../components/PreviewTable";
import { ImportButton } from "../components/ImportButton";
import { BackButton } from "../components/BackButton";
import { getCSVData, clearCSVData } from "../utils/csvStorage";
import { toast } from "sonner";

export default function PreviewPage() {
  useOperatorAuth();
  const router = useRouter();
  const { loading, importWords } = useWordImport();
  
  const csvData = useMemo(() => {
    const stored = getCSVData();
    if (!stored) {
      router.replace("/operator/import");
      return null;
    }
    return stored;
  }, [router]);

  const handleImport = async () => {
    if (!csvData) {
      toast.error("请先选择文件");
      return;
    }

    try {
      const result = await importWords(csvData.data);
      if (result.success) {
        toast.success(`成功导入 ${result.count} 个单词！`);
        clearCSVData();
        router.push("/operator/import");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "导入失败";
      toast.error(errorMessage);
    }
  };

  if (!csvData) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-blue-950 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            导入词库 - 步骤 2 - 数据预览
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            请确认以下数据，确认无误后点击导入
          </p>
        </div>
      </div>

      {csvData.data.rows.length > 0 && <PreviewTable data={csvData.data} />}

      <div className="mt-6 flex items-center justify-between">
        <BackButton label="上一步：选择文件" />
        <div className="flex-1 flex justify-center">
          <ImportButton
            onClick={handleImport}
            loading={loading}
            disabled={loading || csvData.data.rows.length === 0}
          />
        </div>
        <div className="w-[120px]"></div>
      </div>
    </div>
  );
}

