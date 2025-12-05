import { useState } from "react";
import Papa from "papaparse";

export interface CSVData {
  headers: string[];
  rows: any[];
}

export function useCSVParser() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CSVData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = async (file: File): Promise<CSVData> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<string[]>) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV 解析错误: ${results.errors[0].message}`));
            return;
          }

          const data = results.data as string[][];
          if (data.length === 0) {
            reject(new Error("CSV 文件为空"));
            return;
          }

          // First row is headers
          const headers = data[0].map((h) => h.trim());
          
          // Rest are data rows, convert to objects
          const rows = data.slice(1).map((row) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              const value = row[index];
              obj[header] = typeof value === "string" ? value.trim() : value || "";
            });
            return obj;
          }).filter(row => Object.values(row).some(val => val && typeof val === "string" && val.trim() !== ""));

          resolve({ headers, rows });
        },
        error: (error: Error) => {
          reject(new Error(`CSV 解析失败: ${error.message}`));
        },
      });
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setError("仅支持 CSV 文件格式");
      return;
    }

    setFile(selectedFile);
    setError(null);

    try {
      const parsed = await parseCSV(selectedFile);
      setPreviewData(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : "CSV 文件解析失败，请检查文件格式";
      setError(message);
      setFile(null);
      setPreviewData(null);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewData(null);
    setError(null);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return {
    file,
    previewData,
    error,
    handleFileChange,
    reset,
  };
}

