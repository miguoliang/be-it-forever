"use client";

import { useState, useRef } from "react";

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
    } else if (file) {
      alert("请选择 CSV 文件");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // TODO: Implement CSV upload logic
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/knowledge/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "导入失败");
        return;
      }

      alert("导入成功！");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      alert("导入失败，请重试");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          导入词库
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          选择 CSV 文件导入知识条目
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 md:p-8">
        <div className="space-y-6">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择 CSV 文件
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="px-4 md:px-6 py-2 md:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                  />
                </svg>
                <span>选择文件</span>
              </label>
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400"
                    fill="none"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                  <span>{selectedFile.name}</span>
                  <span className="text-gray-400">
                    ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Import Button */}
          <div>
            <button
              onClick={handleImport}
              disabled={!selectedFile || isUploading}
              className={`px-6 md:px-8 py-3 md:py-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg text-base md:text-lg font-medium transition-colors ${
                !selectedFile || isUploading
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isUploading ? "导入中..." : "导入"}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              CSV 格式说明
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>CSV 文件应包含以下列：name, description, phonetic (可选)</li>
              <li>第一行应为列标题</li>
              <li>使用 UTF-8 编码</li>
              <li>每行代表一个知识条目</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

