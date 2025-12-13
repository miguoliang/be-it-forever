import { createRouteHandlerClient } from '@/lib/supabaseServer';
import { NextResponse, type NextRequest } from 'next/server';
import { nowISO } from '@/lib/utils/dateUtils';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createRouteHandlerClient();
  const { id } = await params;

  // Check operator permission
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "operator") {
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

    // Check if the target account is an operator - operators cannot receive cards
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY 未配置" },
        { status: 500 }
      );
    }

    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: targetUser, error: userError } = await adminClient.auth.admin.getUserById(accountId);
    
    if (userError) {
      console.error("Get target user error:", userError);
      return NextResponse.json(
        { error: "获取目标账户信息失败" },
        { status: 500 }
      );
    }

    if (!targetUser || !targetUser.user) {
      return NextResponse.json(
        { error: "目标账户不存在" },
        { status: 404 }
      );
    }

    const targetRole = (targetUser.user.user_metadata?.role as string)?.trim() || "learner";
    if (targetRole === "operator") {
      return NextResponse.json(
        { error: "不能给 operator 分配卡片" },
        { status: 400 }
      );
    }

    // Get all knowledge items
    const { data: knowledges, error: knowledgesError } = await supabase
      .from("knowledge")
      .select("code");

    if (knowledgesError) {
      console.error("Fetch knowledges error:", knowledgesError);
      return NextResponse.json(
        { error: "获取知识列表失败" },
        { status: 500 }
      );
    }

    if (!knowledges || knowledges.length === 0) {
      return NextResponse.json(
        { error: "知识库中没有可分配的卡片" },
        { status: 400 }
      );
    }

    // Get default card type
    const { data: cardTypes, error: cardTypesError } = await supabase
      .from("card_types")
      .select("code")
      .limit(1);

    let finalCardTypeCode = "ST-0000001"; // Default fallback
    if (!cardTypesError && cardTypes && cardTypes.length > 0) {
      finalCardTypeCode = cardTypes[0].code;
    }

    // Prepare account cards data for all knowledge items
    const accountCardsToInsert: any[] = [];
    const now = nowISO();
    const accountCards = knowledges.map((knowledge: { code: string }) => ({
      account_id: accountId,
      knowledge_code: knowledge.code,
      card_type_code: finalCardTypeCode,
      ease_factor: 2.5,
      interval_days: 0,
      repetitions: 0,
      next_review_date: now,
      created_at: now,
      updated_at: now,
    }));

    // Use batch insert with ON CONFLICT DO NOTHING in a transaction
    // Supabase's upsert with ignoreDuplicates uses ON CONFLICT DO NOTHING at DB level
    // The entire batch insert is atomic (single transaction)
    const { data: insertedData, error: insertError } = await supabase
      .from("account_cards")
      .upsert(accountCards, {
        onConflict: "account_id,knowledge_code,card_type_code",
        ignoreDuplicates: true,
      })
      .select();

    if (insertError) {
      console.error("Distribute cards error:", insertError);
      return NextResponse.json(
        { error: insertError.message || "分配卡片失败" },
        { status: 500 }
      );
    }

    const insertedCount = insertedData?.length || 0;
    const skippedCount = accountCards.length - insertedCount;

    return NextResponse.json({
      success: true,
      message: `成功分配 ${insertedCount} 张卡片${skippedCount > 0 ? `（${skippedCount} 张已存在）` : ""}`,
      count: insertedCount,
    });
  } catch (error) {
    console.error("Distribute cards exception:", error);
    const errorMessage = error instanceof Error ? error.message : "分配卡片失败";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

