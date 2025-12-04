// src/app/layout.tsx
import './globals.css'
import Providers from './providers'
import { Analytics } from "@vercel/analytics/next"
import Link from 'next/link'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" className="dark">
      <body>
        <Providers>{children}</Providers>
        <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-around py-4">
            <Link href="/" className="text-2xl text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">Home</Link>
            <Link href="/learn" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Learn</Link>
            <Link href="/stats" className="text-2xl text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">Stats</Link>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  )
}
