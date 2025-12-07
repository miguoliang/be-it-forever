import { useMutation } from "@tanstack/react-query";
import { CSVData } from "./useCSVParser";

interface ImportResult {
  success: boolean;
  count?: number;
  error?: string;
}

export function useWordImport() {
  const { mutateAsync: importWords, isPending: loading, error } = useMutation({
    mutationFn: async (previewData: CSVData): Promise<ImportResult> => {
      const res = await fetch("/api/import-words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ words: previewData.rows }),
      });

      const result = await res.json();

      if (res.ok) {
        return { success: true, count: result.count };
      } else {
        const errorMessage = result.error || "导入失败";
        throw new Error(errorMessage);
      }
    },
  });

  return {
    loading,
    error: error ? (error as Error).message : null,
    importWords,
  };
}

