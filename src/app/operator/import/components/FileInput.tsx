interface FileInputProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileName: string | null;
  recordCount: number | null;
  error: string | null;
}

export function FileInput({ onFileChange, fileName, recordCount, error }: FileInputProps) {
  return (
    <div className="mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <input
          type="file"
          accept=".csv"
          onChange={onFileChange}
          className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 text-sm cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition"
        />
        {fileName && (
          <p className="text-gray-600 dark:text-gray-400 mt-4 text-sm text-center">
            已选择：{fileName} ({recordCount || 0} 条记录)
          </p>
        )}
        {error && (
          <p className="text-red-600 dark:text-red-400 mt-4 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
}

