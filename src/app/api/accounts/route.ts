import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/lib/services/accountService";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const supabase = await createRouteHandlerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "operator") {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  // Check if SUPABASE_SERVICE_ROLE_KEY is configured
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY 未配置。请在环境变量中配置 Service Role Key 以访问 auth.users 表。" },
      { status: 500 }
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "10", 10);

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const result = await accountService.listUsers(adminClient, page, perPage);

    return NextResponse.json({
      accounts: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Accounts API error:", error);
    const errorMessage = error instanceof Error ? error.message : "获取账户列表失败";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

