// src/app/api/cards/due/route.ts
import { createRouteHandlerClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

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

    if (error) {
      console.error('Fetch due cards error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Get due cards error:', error)
    const errorMessage =
      error instanceof Error ? error.message : '获取卡片失败'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}