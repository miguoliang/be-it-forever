// src/app/layout.tsx
'use client'

import './globals.css'
import Providers from './providers'
import { Analytics } from "@vercel/analytics/next"
import { NavigationFooter } from './components/NavigationFooter'
import { usePathname } from 'next/navigation'

// Routes that should show the navigation footer
const FOOTER_ROUTES = ["/learn", "/stats"];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const shouldShowFooter = pathname && FOOTER_ROUTES.includes(pathname);

  return (
    <html lang="zh" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        {shouldShowFooter && <NavigationFooter />}
        <Analytics />
      </body>
    </html>
  )
}
