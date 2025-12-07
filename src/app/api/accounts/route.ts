import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createRouteHandlerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "operator") {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  try {
    // 尝试查询 accounts 表
    const { data: accountsData, error: accountsError } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (accountsError && accountsError.code !== "PGRST116") {
      // PGRST116 表示表不存在，其他错误才返回
      console.error("Accounts table error:", accountsError);
    }

    // 如果 accounts 表存在且有数据，返回它
    if (accountsData && accountsData.length > 0) {
      // 返回账户数据
      // 注意：如果需要获取邮箱等 auth 信息，需要使用 Supabase Admin API
      const accountsWithInfo = accountsData.map((account: any) => ({
        id: account.id,
        username: account.username,
        email: account.email || null,
        role: account.role || null,
        created_at: account.created_at,
        updated_at: account.updated_at,
      }));
      return NextResponse.json(accountsWithInfo);
    }

    // 如果没有 accounts 表，返回提示信息
    // 实际项目中，应该使用 Supabase Admin API 查询 auth.users
    return NextResponse.json(
      {
        message: "accounts 表不存在或为空。如需查询 Supabase Auth 用户，请使用 Admin API。",
        accounts: [],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Accounts API error:", error);
    return NextResponse.json(
      { error: error.message || "获取账户列表失败" },
      { status: 500 }
    );
  }
}

