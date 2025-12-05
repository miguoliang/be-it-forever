import { CSVData } from "../hooks/useCSVParser";

const STORAGE_KEY = "import_csv_data";
const STORAGE_FILE_NAME_KEY = "import_csv_filename";

export function saveCSVData(data: CSVData, fileName: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  sessionStorage.setItem(STORAGE_FILE_NAME_KEY, fileName);
}

export function getCSVData(): { data: CSVData; fileName: string } | null {
  if (typeof window === "undefined") return null;
  
  const dataStr = sessionStorage.getItem(STORAGE_KEY);
  const fileName = sessionStorage.getItem(STORAGE_FILE_NAME_KEY);
  
  if (!dataStr || !fileName) return null;
  
  try {
    const data = JSON.parse(dataStr) as CSVData;
    return { data, fileName };
  } catch {
    return null;
  }
}

export function clearCSVData() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_FILE_NAME_KEY);
}

