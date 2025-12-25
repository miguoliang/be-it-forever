import { createRouteHandlerClient } from '@/lib/supabaseServer';
import { NextRequest } from 'next/server';
import { accountService } from '@/lib/services/accountService';
import { createClient } from "@supabase/supabase-js";
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient();
    const { id } = await params;

    // Check operator permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.app_metadata?.role !== "operator") {
      throw ApiError.forbidden("权限不足");
    }

    // Account ID is a UUID (from Supabase Auth)
    const accountId = id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(accountId)) {
      throw ApiError.validationError("无效的账户ID格式");
    }

    // Check if SUPABASE_SERVICE_ROLE_KEY is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw ApiError.internal("SUPABASE_SERVICE_ROLE_KEY 未配置");
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const result = await accountService.distributeCards(adminClient, accountId);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}