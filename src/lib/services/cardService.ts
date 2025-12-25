import { SupabaseClient } from '@supabase/supabase-js';
import { getTodayDateRange, nowISO } from '@/lib/utils/dateUtils';
import { Card, KnowledgeMetadata } from '@/app/learn/types';
import { DAILY_REVIEW_LIMIT } from '@/lib/constants';
import { ApiError } from '@/lib/utils/apiError';

export interface DueCardsResult {
  reviewedCount: number;
  cards: Card[];
}

export interface ReviewCardResult {
  success: boolean;
  nextReview: string;
}

interface RawCardData {
  id: number;
  knowledge_code: string;
  card_type_code: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_at: string | null;
  knowledge: {
    code: string;
    name: string;
    description: string;
    metadata: KnowledgeMetadata;
  };
  card_types: {
    code: string;
    card_type_templates: {
      role: string;
      templates: {
        content: string;
      } | null;
    }[];
  };
}

/**
 * Service to handle card-related business logic
 */
export const cardService = {
  /**
   * Get the number of cards reviewed today by the user
   */
  async getReviewedTodayCount(
    supabase: SupabaseClient,
    userId: string
  ): Promise<number> {
    const { startOfToday, endOfToday } = getTodayDateRange();

    const { count, error } = await supabase
      .from('account_cards')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', userId)
      .gte('last_reviewed_at', startOfToday.toISOString())
      .lte('last_reviewed_at', endOfToday.toISOString());

    if (error) {
      throw ApiError.internal(`Count reviewed today error: ${error.message}`);
    }

    return count ?? 0;
  },

  /**
   * Fetch due cards for the user, respecting the daily limit
   */
  async getDueCards(
    supabase: SupabaseClient,
    userId: string
  ): Promise<DueCardsResult> {
    // 1. Check daily limit
    const currentReviewedCount = await this.getReviewedTodayCount(supabase, userId);

    if (currentReviewedCount >= DAILY_REVIEW_LIMIT) {
      return {
        reviewedCount: DAILY_REVIEW_LIMIT,
        cards: [],
      };
    }

    const remainingSlots = DAILY_REVIEW_LIMIT - currentReviewedCount;

    // 2. Fetch due cards
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
      .eq('account_id', userId)
      .lte('next_review_date', nowISO())
      .order('next_review_date', { ascending: true })
      .limit(remainingSlots);

    if (dueError) {
      throw ApiError.internal(`Fetch due cards error: ${dueError.message}`);
    }

    // 3. Transform response
    const formattedCards = (dueCards as unknown as RawCardData[])?.map((card) => {
      // Define types for the raw DB response structure for clarity
      interface TemplateRelation {
        role: string;
        templates: { content: string } | null;
      }

      // Explicitly type the joined property
      const cardTypeTemplates = card.card_types?.card_type_templates as TemplateRelation[];

      const templates = cardTypeTemplates?.reduce(
        (acc: { front?: string; back?: string }, t: TemplateRelation) => {
          if (t.role === 'front') acc.front = t.templates?.content;
          if (t.role === 'back') acc.back = t.templates?.content;
          return acc;
        },
        { front: '', back: '' }
      );

      // Remove the complex nested structure before returning
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { card_types, ...rest } = card;
      
      // Ensure the return object matches Card interface
      return {
        ...rest,
        templates: templates as { front: string; back: string },
      };
    });

    return {
      reviewedCount: currentReviewedCount,
      cards: formattedCards ?? [],
    };
  },

  /**
   * Process a card review
   */
  async reviewCard(
    supabase: SupabaseClient,
    userId: string,
    cardId: number,
    quality: number
  ): Promise<ReviewCardResult> {
    // 1. Fetch current card state
    const { data: card, error: fetchError } = await supabase
      .from('account_cards')
      .select('*')
      .eq('id', cardId)
      .eq('account_id', userId)
      .single();

    if (fetchError || !card) {
      throw ApiError.notFound('卡片不存在');
    }

    // 2. Check daily limit
    const { startOfToday, endOfToday } = getTodayDateRange();
    
    // Check if this card was already reviewed today
    const isCardReviewedToday =
      card.last_reviewed_at &&
      new Date(card.last_reviewed_at) >= startOfToday &&
      new Date(card.last_reviewed_at) <= endOfToday;

    // If this is a new card to review (not reviewed today), check daily limit
    if (!isCardReviewedToday) {
      const reviewedTodayCount = await this.getReviewedTodayCount(supabase, userId);

      if (reviewedTodayCount >= DAILY_REVIEW_LIMIT) {
        throw ApiError.dailyLimitExceeded(`今日已复习${DAILY_REVIEW_LIMIT}张卡片，已达到每日限制`);
      }
    }

    // 3. SM-2 Algorithm
    let newEase = Number(card.ease_factor);
    let newReps = Number(card.repetitions);
    let newInterval = Number(card.interval_days);

    if (quality >= 3) {
      // Correct answer
      if (newReps === 0) newInterval = 1;
      else if (newReps === 1) newInterval = 6;
      else newInterval = Math.round(newInterval * newEase);

      newReps += 1;
    } else {
      // Incorrect, reset
      newReps = 0;
      newInterval = 1;
    }

    // Adjust Ease Factor
    newEase += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    if (newEase < 1.3) newEase = 1.3;

    const nextReview = new Date();
    nextReview.setUTCDate(nextReview.getUTCDate() + newInterval);
    nextReview.setUTCHours(0, 0, 0, 0);

    // 4. Call RPC to Update Card & Insert History Transactionally
    const { error: rpcError } = await supabase.rpc('review_card', {
        p_card_id: cardId,
        p_user_id: userId,
        p_quality: quality,
        p_ease_factor: parseFloat(newEase.toFixed(2)),
        p_interval_days: newInterval,
        p_repetitions: newReps,
        p_next_review_date: nextReview.toISOString()
    });

    if (rpcError) {
      throw ApiError.internal(`Review card failed: ${rpcError.message}`);
    }

    return {
      success: true,
      nextReview: nextReview.toISOString(),
    };
  },
};