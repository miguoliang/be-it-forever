// src/app/api/knowledge/route.ts
import { createRouteHandlerClient } from '@/lib/supabaseServer'
import { NextRequest } from 'next/server'
import { knowledgeService, ImportKnowledgeParams } from '@/lib/services/knowledgeService'
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError'

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw ApiError.unauthorized('未登录')

    // Check if user is operator
    if (user.app_metadata?.role !== 'operator') {
      throw ApiError.forbidden('权限不足')
    }

    const data = await knowledgeService.getAllKnowledge(supabase)

    return apiSuccess(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    let items: ImportKnowledgeParams[] = [];
    
    try {
      const body = await req.json();
      // Handle both array input and wrapped input
      if (Array.isArray(body)) {
        items = body;
      } else if (body && Array.isArray(body.items)) {
        items = body.items;
      } else {
         throw ApiError.validationError("Invalid request format. Expected an array of items.");
      }
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw ApiError.validationError("Invalid JSON");
    }

    if (items.length === 0) {
      throw ApiError.validationError("No items to import");
    }

    const supabase = await createRouteHandlerClient();

    // Check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.app_metadata?.role !== "operator") {
      throw ApiError.forbidden("Permission denied");
    }

    const result = await knowledgeService.importKnowledge(supabase, items);
    
    if (!result.success && result.message === "No valid items found") {
        throw ApiError.validationError(result.message);
    }

    return apiSuccess(result);

  } catch (e) {
    return handleApiError(e);
  }
}
