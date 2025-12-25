import { useState } from "react";
import { parseCSV, CSVData } from "../utils/csvParser";

export type { CSVData } from "../utils/csvParser";

export function useCSVParser() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CSVData | null>(null);
  const [error, setError] = useState<string | null>(null);

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