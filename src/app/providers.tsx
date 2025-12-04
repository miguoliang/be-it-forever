// src/app/providers.tsx
'use client'

import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') router.refresh()
      if (event === 'SIGNED_OUT') router.push('/')
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return <>{children}</>
}