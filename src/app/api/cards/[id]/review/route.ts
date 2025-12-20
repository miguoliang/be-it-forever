// src/app/api/cards/[id]/review/route.ts
import { createRouteHandlerClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import { cardService } from '@/lib/services/cardService'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { quality } = await request.json() // 0-5
    
    // Validate quality parameter
    if (typeof quality !== 'number' || quality < 0 || quality > 5) {
      return NextResponse.json(
        { error: '评分必须在 0-5 之间' },
        { status: 400 }
      )
    }

    const supabase = await createRouteHandlerClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const cardId = parseInt(id, 10)
    if (isNaN(cardId)) {
      return NextResponse.json({ error: '无效的卡片ID' }, { status: 400 })
    }

    const result = await cardService.reviewCard(supabase, user.id, cardId, quality)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Review card error:', error)
    const errorMessage =
      error instanceof Error ? error.message : '复习失败'
      
    // Return specific status codes based on error message
    if (errorMessage.includes('今日已复习10张卡片')) {
      return NextResponse.json({ error: errorMessage }, { status: 403 })
    }
    if (errorMessage === '卡片不存在') {
      return NextResponse.json({ error: errorMessage }, { status: 404 })
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}