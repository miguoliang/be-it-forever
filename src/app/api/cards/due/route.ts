// src/app/api/cards/due/route.ts
import { createRouteHandlerClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import { getTodayDateRange, nowISO } from '@/lib/utils/dateUtils'

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // Get today's date range in UTC (start and end of today)
    const { startOfToday, endOfToday } = getTodayDateRange()

    // First, count how many cards have been reviewed today (database operation)
    const { count: reviewedTodayCount, error: countError } = await supabase
      .from('account_cards')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', user.id)
      .gte('last_reviewed_at', startOfToday.toISOString())
      .lte('last_reviewed_at', endOfToday.toISOString())

    if (countError) {
      console.error('Count reviewed today error:', countError)
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    // Daily limit: 10 cards per day
    // If user has already reviewed 10 cards today, they cannot review more
    // Return consistent format: { reviewedCount: 10, cards: [] }
    const currentReviewedCount = reviewedTodayCount ?? 0
    if (currentReviewedCount >= 10) {
      return NextResponse.json({
        reviewedCount: 10,
        cards: []
      })
    }

    // User hasn't reached daily limit yet
    // Fetch due cards only (we already have the reviewed count)
    const remainingSlots = 10 - currentReviewedCount

    // Fetch due cards (cards that need to be reviewed and haven't been reviewed today)
    const { data: dueCards, error: dueError } = await supabase
      .from('account_cards')
      .select(`
        id,
        knowledge_code,
        card_type_code,
        knowledge!inner (
          code,
          name,
          description,
          metadata
        ),
        card_types!inner (
          code,
          card_type_templates (
            role,
            templates (
              content
            )
          )
        ),
        ease_factor,
        interval_days,
        repetitions,
        next_review_date,
        last_reviewed_at
      `)
      .eq('account_id', user.id)
      .lte('next_review_date', nowISO())
      .order('next_review_date', { ascending: true })
      .limit(remainingSlots)

    if (dueError) {
      console.error('Fetch due cards error:', dueError)
      return NextResponse.json({ error: dueError.message }, { status: 500 })
    }

    // Transform response to include simplified template structure
    const formattedCards = dueCards?.map(card => {
      // Define types for the raw DB response structure for clarity
      interface TemplateRelation {
        role: string;
        templates: { content: string } | null;
      }
      
      // Explicitly type the joined property
      const cardTypeTemplates = (card.card_types as unknown as { card_type_templates: TemplateRelation[] })?.card_type_templates;

      const templates = cardTypeTemplates?.reduce((acc: { front?: string; back?: string }, t: TemplateRelation) => {
        if (t.role === 'front') acc.front = t.templates?.content;
        if (t.role === 'back') acc.back = t.templates?.content;
        return acc;
      }, { front: '', back: '' });

      // Remove the complex nested structure before returning
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { card_types, ...rest } = card;
      return {
        ...rest,
        templates
      };
    });

    // Return reviewed count and due cards array
    return NextResponse.json({
      reviewedCount: currentReviewedCount,
      cards: formattedCards ?? []
    })
  } catch (error) {
    console.error('Get due cards error:', error)
    const errorMessage =
      error instanceof Error ? error.message : '获取卡片失败'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}