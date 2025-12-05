"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { useWordImport } from "../hooks/useWordImport";
import { PreviewTable } from "../components/PreviewTable";
import { ImportButton } from "../components/ImportButton";
import { BackButton } from "../components/BackButton";
import { getCSVData, clearCSVData } from "../utils/csvStorage";
import { CSVData } from "../hooks/useCSVParser";

export default function PreviewPage() {
  useOperatorAuth();
  const router = useRouter();
  const { loading, importWords } = useWordImport();
  const [csvData, setCsvData] = useState<{ data: CSVData; fileName: string } | null>(null);

  useEffect(() => {
    const stored = getCSVData();
    if (!stored) {
      router.replace("/operator/import");
      return;
    }
    setCsvData(stored);
  }, [router]);

  const handleImport = async () => {
    if (!csvData) {
      alert("请先选择文件");
      return;
    }

    const result = await importWords(csvData.data);

    if (result.success) {
      alert(`成功导入 ${result.count} 个单词！`);
      clearCSVData();
      router.push("/operator/import");
    } else {
      alert(result.error || "导入失败");
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

