import { useState } from "react";
import Papa from "papaparse";
import { WordData } from "../types";

export interface CSVData {
  headers: string[];
  rows: WordData[];
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

          // First row is headers - handle duplicate keys by keeping only the first occurrence
          const headers: string[] = [];
          const headerIndexMap = new Map<string, number>();
          
          data[0].forEach((h, index) => {
            const trimmedHeader = h.trim();
            if (!headerIndexMap.has(trimmedHeader)) {
              headerIndexMap.set(trimmedHeader, index);
              headers.push(trimmedHeader);
            }
            // If duplicate, ignore it
          });
          
          // Rest are data rows, convert to standardized WordData format
          const rows: WordData[] = data.slice(1)
            .map((row) => {
              const rowObj: Record<string, string> = {};
              headers.forEach((header) => {
                const index = headerIndexMap.get(header);
                if (index !== undefined) {
                  const value = row[index];
                  rowObj[header] = typeof value === "string" ? value.trim() : value || "";
                }
              });

              // Map CSV columns to standardized WordData structure
              const wordData: WordData = {
                name: rowObj["English Word"] || rowObj["english"] || rowObj["word"] || rowObj["name"] || "",
                description: rowObj["Chinese Translation"] || rowObj["chinese"] || rowObj["translation"] || rowObj["description"] || "",
                metadata: {
                  pos: rowObj["POS"] || rowObj["pos"] || null,
                  level: rowObj["Level"] || rowObj["level"] || null,
                  example: rowObj["Example Sentence"] || rowObj["example"] || rowObj["exampleSentence"] || null,
                  prompt: rowObj["Self-Examine Prompt"] || rowObj["prompt"] || rowObj["selfExaminePrompt"] || null,
                  theme: rowObj["Theme"] || rowObj["theme"] || null,
                  phonetic: rowObj["Phonetic"] || rowObj["phonetic"] || null,
                },
              };

              return wordData;
            })
            .filter((word) => word.name && word.name.trim() !== "");

          // Remove duplicates based on name (case-sensitive)
          const seenNames = new Set<string>();
          const uniqueRows: WordData[] = [];
          
          rows.forEach((word) => {
            const trimmedName = word.name.trim();
            if (!seenNames.has(trimmedName)) {
              seenNames.add(trimmedName);
              uniqueRows.push(word);
            }
            // If duplicate name, ignore it and continue
          });

          resolve({ headers, rows: uniqueRows });
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

