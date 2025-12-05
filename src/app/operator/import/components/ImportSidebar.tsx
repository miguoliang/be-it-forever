interface ImportSidebarProps {
  currentStep: number;
  fileName?: string | null;
  recordCount?: number | null;
  children?: React.ReactNode;
}

export function ImportSidebar({
  currentStep,
  fileName,
  recordCount,
  children,
}: ImportSidebarProps) {
  return (
    <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 sticky top-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">导入指南</h3>

        {currentStep === 1 && (
          <div className="space-y-4 text-gray-600 dark:text-gray-400 text-sm">
            <div>
              <h4 className="text-gray-900 dark:text-white font-semibold mb-2">步骤说明</h4>
              <p>1. 选择 CSV 格式的文件</p>
              <p>2. 系统将自动解析文件内容</p>
              <p>3. 点击"下一步"进入预览页面</p>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-gray-900 dark:text-white font-semibold mb-2">文件要求</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>仅支持 CSV 格式</li>
                <li>第一行为列标题</li>
                <li>确保数据格式正确</li>
              </ul>
            </div>
            {fileName && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-900 dark:text-white font-semibold mb-1">当前文件</p>
                <p className="text-indigo-600 dark:text-indigo-400 break-words">{fileName}</p>
                {recordCount !== null && (
                  <p className="text-gray-500 dark:text-gray-500 mt-1">{recordCount} 条记录</p>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4 text-gray-600 dark:text-gray-400 text-sm">
            <div>
              <h4 className="text-gray-900 dark:text-white font-semibold mb-2">预览说明</h4>
              <p>请仔细检查以下数据：</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>确认数据格式正确</li>
                <li>检查是否有缺失字段</li>
                <li>使用分页浏览所有记录</li>
              </ul>
            </div>
            {fileName && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-900 dark:text-white font-semibold mb-1">文件信息</p>
                <p className="text-indigo-600 dark:text-indigo-400 break-words">{fileName}</p>
                {recordCount !== null && (
                  <p className="text-gray-500 dark:text-gray-500 mt-1">{recordCount} 条记录</p>
                )}
              </div>
            )}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-gray-900 dark:text-white font-semibold mb-2">注意事项</h4>
              <p className="text-yellow-600 dark:text-yellow-400">
                导入后数据将添加到词库，新用户注册时将自动获得这些卡片
              </p>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

