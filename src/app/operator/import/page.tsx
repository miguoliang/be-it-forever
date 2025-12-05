"use client";

import { useOperatorAuth } from "./hooks/useOperatorAuth";
import { useCSVParser } from "./hooks/useCSVParser";
import { FileInput } from "./components/FileInput";
import { NextButton } from "./components/NextButton";
import { saveCSVData } from "./utils/csvStorage";

export default function ImportLibrary() {
  useOperatorAuth();

  const { file, previewData, error, handleFileChange } = useCSVParser();

  const handleNext = () => {
    if (previewData && file) {
      saveCSVData(previewData, file.name);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          导入词库 - 步骤 1
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          仅支持 CSV 格式，自动识别字段
        </p>
      </div>

      <FileInput
        onFileChange={handleFileChange}
        fileName={file?.name || null}
        recordCount={previewData?.rows.length || null}
        error={error}
      />

      <div className="mt-6">
        <NextButton
          onClick={handleNext}
          disabled={!file || !previewData || previewData.rows.length === 0}
        />
      </div>
    </div>
  );
}
