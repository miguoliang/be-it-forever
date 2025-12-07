// src/app/providers.tsx
'use client'

import { createClient } from '@/lib/supabaseClient'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'

// Valid routes that should handle auth state changes
const VALID_ROUTES = ["/", "/learn", "/stats", "/operator"];

export default function Providers({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip auth state changes on internal Next.js paths or invalid routes (404s)
    if (
      !pathname ||
      pathname.startsWith("/_next") ||
      !VALID_ROUTES.includes(pathname)
    ) {
      return;
    }

    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN') {
        // Only refresh if we're on a valid page (not during navigation or 404)
        if (pathname && VALID_ROUTES.includes(pathname)) {
          router.refresh()
        }
      }
      if (event === 'SIGNED_OUT') {
        router.push('/')
      }
    })

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    }
  }, [supabase, router, pathname])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}