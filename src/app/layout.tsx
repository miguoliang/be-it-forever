// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import { Analytics } from "@vercel/analytics/next"
import { ConditionalFooter } from './components/ConditionalFooter'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: '背它一辈子',
  description: '一个基于间隔重复的英语学习应用',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <ConditionalFooter />
        <Toaster position="top-center" />
        <Analytics />
      </body>
    </html>
  )
}
