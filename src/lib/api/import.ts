// API functions for import
import type { CSVData } from "@/app/operator/import/hooks/useCSVParser";

export interface ImportResult {
  success: boolean;
  count?: number;
  error?: string;
}

export async function importWords(previewData: CSVData): Promise<ImportResult> {
  const res = await fetch("/api/knowledge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items: previewData.rows }),
  });

  const result = await res.json();

  if (res.ok) {
    return { success: true, count: result.count };
  } else {
    const errorMessage = result.error || "导入失败";
    throw new Error(errorMessage);
  }
}

