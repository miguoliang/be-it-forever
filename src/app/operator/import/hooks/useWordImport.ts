import { useState } from "react";
import { CSVData } from "./useCSVParser";

interface ImportResult {
  success: boolean;
  count?: number;
  error?: string;
}

export function useWordImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importWords = async (previewData: CSVData): Promise<ImportResult> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/import-words", {
        method: "POST",
        body: JSON.stringify({ words: previewData.rows }),
      });

      const result = await res.json();

      if (res.ok) {
        return { success: true, count: result.count };
      } else {
        const errorMessage = result.error || "导入失败";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err: any) {
      const errorMessage = err.message || "导入失败";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    importWords,
  };
}

