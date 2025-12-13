// src/app/api/cards/[id]/review/route.ts
import { createRouteHandlerClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import { getTodayDateRange } from '@/lib/utils/dateUtils'

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

  // 1. 先查出当前卡片状态
  const { data: card, error: fetchError } = await supabase
    .from('account_cards')
    .select('*')
    .eq('id', cardId)
    .eq('account_id', user.id)
    .single()

  if (fetchError || !card) return NextResponse.json({ error: '卡片不存在' }, { status: 404 })

  // Check daily review limit (10 cards per day)
  // Get today's date range in UTC
  const { startOfToday, endOfToday } = getTodayDateRange()
  
  // Check if this card was already reviewed today
  const isCardReviewedToday = card.last_reviewed_at && 
    new Date(card.last_reviewed_at) >= startOfToday &&
    new Date(card.last_reviewed_at) <= endOfToday
  
  // If this is a new card to review (not reviewed today), check daily limit
  if (!isCardReviewedToday) {
    // Count cards reviewed today
    const { count: reviewedTodayCount, error: countError } = await supabase
      .from('account_cards')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', user.id)
      .gte('last_reviewed_at', startOfToday.toISOString())
      .lte('last_reviewed_at', endOfToday.toISOString())
    
    if (countError) {
      console.error('Count reviewed today error:', countError)
      return NextResponse.json({ error: '检查每日限制失败' }, { status: 500 })
    }
    
    // If already reviewed 10 cards today, cannot review more
    if (reviewedTodayCount && reviewedTodayCount >= 10) {
      return NextResponse.json(
        { error: '今日已复习10张卡片，已达到每日限制' },
        { status: 403 }
      )
    }
  }

  // 2. 完整 SM-2 算法（Anki 官方实现）
  let newEase = card.ease_factor
  let newReps = card.repetitions
  let newInterval = card.interval_days

  if (quality >= 3) {
    // 答对
    if (newReps === 0) newInterval = 1
    else if (newReps === 1) newInterval = 6
    else newInterval = Math.round(newInterval * newEase)

    newReps += 1
  } else {
    // 答错，重置
    newReps = 0
    newInterval = 1
  }

  // Ease Factor 调整
  newEase += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  if (newEase < 1.3) newEase = 1.3

  const nextReview = new Date()
  nextReview.setUTCDate(nextReview.getUTCDate() + newInterval)
  nextReview.setUTCHours(0, 0, 0, 0)

  // 3. 更新卡片 + 写历史
  const { error: updateError } = await supabase
    .from('account_cards')
    .update({
      ease_factor: parseFloat(newEase.toFixed(2)),
      interval_days: newInterval,
      repetitions: newReps,
      next_review_date: nextReview.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', cardId)

    if (updateError) {
      console.error('Update card error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    const { error: historyError } = await supabase
      .from('review_history')
      .insert({ account_card_id: cardId, quality })

    if (historyError) {
      console.error('Insert review history error:', historyError)
      // Don't fail the request if history insert fails, but log it
    }

    return NextResponse.json({
      success: true,
      nextReview: nextReview.toISOString(),
    })
  } catch (error) {
    console.error('Review card error:', error)
    const errorMessage =
      error instanceof Error ? error.message : '复习失败'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}