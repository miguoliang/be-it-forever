import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileInputProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileName: string | null;
  recordCount: number | null;
  error: string | null;
}

export const FileInput = ({ onFileChange, fileName, recordCount, error }: FileInputProps) => {
  return (
    <div className="mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <Label htmlFor="file-upload" className="sr-only">
          选择 CSV 文件
        </Label>
        <Input
          id="file-upload"
          type="file"
          accept=".csv"
          onChange={onFileChange}
          className="w-full border-2 border-dashed border-input cursor-pointer hover:border-primary transition"
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
};

