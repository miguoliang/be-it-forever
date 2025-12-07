import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createRouteHandlerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "operator") {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  // Check if SUPABASE_SERVICE_ROLE_KEY is configured
  // Service Role Key is required to access auth.users via Admin API
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY 未配置。请在环境变量中配置 Service Role Key 以访问 auth.users 表。" },
      { status: 500 }
    );
  }

  try {
    // Get pagination parameters from query string
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "10", 10);

    // Use Admin API to list users with pagination
    // Admin API requires Service Role Key and can directly access auth.users
    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: usersResponse, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    if (!usersResponse || !usersResponse.users) {
      throw new Error("无法获取用户列表");
    }

    // Map users to expected format
    const accounts = usersResponse.users.map((u) => ({
      id: u.id,
      username: u.user_metadata?.username || u.email?.split("@")[0] || u.id.substring(0, 8),
      email: u.email || "",
      role: (u.user_metadata?.role as string)?.trim() || "learner",
      created_at: u.created_at,
      updated_at: u.updated_at || u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
    }));

    // Check if there are more pages
    // If we got exactly perPage items, there might be more
    const hasMore = usersResponse.users.length === perPage;

    return NextResponse.json({
      accounts,
      pagination: {
        page,
        perPage,
        hasMore,
        // Note: Total count requires a separate API call or RPC function
        // For now, we'll indicate if there might be more pages
      },
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

