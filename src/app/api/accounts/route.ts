import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextRequest } from "next/server";
import { accountService } from "@/lib/services/accountService";
import { createClient } from "@supabase/supabase-js";
import { ApiError, handleApiError, apiSuccess } from "@/lib/utils/apiError";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.app_metadata?.role !== "operator") {
      throw ApiError.forbidden("权限不足");
    }

    // Check if SUPABASE_SERVICE_ROLE_KEY is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw ApiError.internal("SUPABASE_SERVICE_ROLE_KEY 未配置。请在环境变量中配置 Service Role Key 以访问 auth.users 表。");
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "10", 10);

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const result = await accountService.listUsers(adminClient, page, perPage);

    return apiSuccess({
      accounts: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleApiError(error);
  }
}