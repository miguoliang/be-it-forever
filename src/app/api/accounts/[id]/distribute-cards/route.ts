import { createRouteHandlerClient } from '@/lib/supabaseServer';
import { NextResponse, type NextRequest } from 'next/server';
import { accountService } from '@/lib/services/accountService';
import { createClient } from "@supabase/supabase-js";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createRouteHandlerClient();
  const { id } = await params;

  // Check operator permission
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "operator") {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  try {
    // Account ID is a UUID (from Supabase Auth), not an integer
    const accountId = id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(accountId)) {
      return NextResponse.json({ error: "无效的账户ID格式" }, { status: 400 });
    }

    // Check if SUPABASE_SERVICE_ROLE_KEY is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY 未配置" },
        { status: 500 }
      );
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const result = await accountService.distributeCards(adminClient, accountId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Distribute cards exception:", error);
    const errorMessage = error instanceof Error ? error.message : "分配卡片失败";
    
    // Map specific errors to status codes
    if (errorMessage.includes("不存在")) {
        return NextResponse.json({ error: errorMessage }, { status: 404 });
    }
    if (errorMessage.includes("不能给 operator")) {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    if (errorMessage.includes("没有可分配")) {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

