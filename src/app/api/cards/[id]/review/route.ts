import { createRouteHandlerClient } from '@/lib/supabaseServer'
import { NextRequest } from 'next/server'
import { cardService } from '@/lib/services/cardService'
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError'
import { MAX_QUALITY, MIN_QUALITY } from '@/lib/constants'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { quality } = await request.json() // 0-5
    
    // Validate quality parameter
    if (typeof quality !== 'number' || quality < MIN_QUALITY || quality > MAX_QUALITY) {
      throw ApiError.validationError(`评分必须在 ${MIN_QUALITY}-${MAX_QUALITY} 之间`)
    }

    const supabase = await createRouteHandlerClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw ApiError.unauthorized('未登录')
    }

    const cardId = parseInt(id, 10)
    if (isNaN(cardId)) {
      throw ApiError.validationError('无效的卡片ID')
    }

    const result = await cardService.reviewCard(supabase, user.id, cardId, quality)

    return apiSuccess(result)
  } catch (error) {
    return handleApiError(error)
  }
}
