import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-900 dark:text-white mb-4">
          404
        </h1>
        <h2 className="text-4xl font-semibold text-gray-700 dark:text-gray-300 mb-8">
          页面未找到
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
          抱歉，您访问的页面不存在
        </p>
        <Link
          href="/learn"
          className="px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          返回学习页面
        </Link>
      </div>
    </div>
  );
}

