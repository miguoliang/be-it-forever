import { createMiddlewareClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(req: NextRequest) {
  try {
    const { supabase, res } = createMiddlewareClient(req)

    // Refresh session if expired - required for Server Components
    await supabase.auth.getSession()

    return res
  } catch (error) {
    // If there's an error (e.g., during prerendering), just continue
    // This prevents crashes during static generation
    return NextResponse.next({ request: req })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _not-found (Next.js not-found page)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|_not-found|favicon.ico).*)',
  ],
}

