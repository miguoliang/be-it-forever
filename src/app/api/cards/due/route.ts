// src/app/api/cards/due/route.ts
import { createRouteHandlerClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createRouteHandlerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { data, error } = await supabase
    .from('account_cards')
    .select(`
      id,
      knowledge_code,
      knowledge!inner (
        code,
        name,
        description
      ),
      ease_factor,
      interval_days,
      repetitions,
      next_review_date
    `)
    .eq('account_id', user.id)
    .lte('next_review_date', new Date().toISOString())
    .order('next_review_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}