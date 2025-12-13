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

    // Get today's date range in UTC (start and end of today)
    const now = new Date()
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
    const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))

    // Fetch cards that are either:
    // 1. Due (next_review_date <= now) - cards that need to be reviewed
    // 2. Reviewed today (last_reviewed_at is between start and end of today) - cards already reviewed today
    
    // Fetch due cards
    const { data: dueCards, error: dueError } = await supabase
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
        next_review_date,
        last_reviewed_at
      `)
      .eq('account_id', user.id)
      .lte('next_review_date', now.toISOString())

    if (dueError) {
      console.error('Fetch due cards error:', dueError)
      return NextResponse.json({ error: dueError.message }, { status: 500 })
    }

    // Fetch cards reviewed today (even if their next_review_date is in the future)
    const { data: reviewedTodayCards, error: reviewedError } = await supabase
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
        next_review_date,
        last_reviewed_at
      `)
      .eq('account_id', user.id)
      .gte('last_reviewed_at', startOfToday.toISOString())
      .lte('last_reviewed_at', endOfToday.toISOString())

    if (reviewedError) {
      console.error('Fetch reviewed today cards error:', reviewedError)
      return NextResponse.json({ error: reviewedError.message }, { status: 500 })
    }

    // Combine both results and remove duplicates (by id)
    type CardType = NonNullable<typeof dueCards>[number]
    const cardMap = new Map<number, CardType>()
    
    // Add due cards
    if (dueCards) {
      dueCards.forEach(card => {
        cardMap.set(card.id, card)
      })
    }
    
    // Add cards reviewed today (they may overlap with due cards)
    if (reviewedTodayCards) {
      reviewedTodayCards.forEach(card => {
        cardMap.set(card.id, card)
      })
    }

    // Convert map back to array and sort by next_review_date
    const allCards = Array.from(cardMap.values()).sort((a, b) => {
      const dateA = new Date(a.next_review_date).getTime()
      const dateB = new Date(b.next_review_date).getTime()
      return dateA - dateB
    })

    return NextResponse.json(allCards)
  } catch (error) {
    console.error('Get due cards error:', error)
    const errorMessage =
      error instanceof Error ? error.message : '获取卡片失败'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}