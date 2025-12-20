// src/app/api/cards/due/route.ts
import { createRouteHandlerClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import { cardService } from '@/lib/services/cardService'

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const result = await cardService.getDueCards(supabase, user.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get due cards error:', error)
    const errorMessage =
      error instanceof Error ? error.message : '获取卡片失败'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}