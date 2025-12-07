import { useMutation } from "@tanstack/react-query";
import { importWords as importWordsAPI, type ImportResult } from "@/lib/api/import";
import type { CSVData } from "./useCSVParser";

export function useWordImport() {
  const { mutateAsync: importWords, isPending: loading, error } = useMutation({
    mutationFn: (previewData: CSVData): Promise<ImportResult> => importWordsAPI(previewData),
  });

  return {
    loading,
    error: error ? (error as Error).message : null,
    importWords,
  };
}

