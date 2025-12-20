// src/app/api/knowledge/route.ts
import { createRouteHandlerClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'
import { knowledgeService, ImportKnowledgeParams } from '@/lib/services/knowledgeService'

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

    // Check if user is operator
    if (user.app_metadata?.role !== 'operator') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const data = await knowledgeService.getAllKnowledge(supabase)

    return NextResponse.json(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
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
         return NextResponse.json(
          { error: "Invalid request format. Expected an array of items." },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No items to import" },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();

    // Check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.app_metadata?.role !== "operator") {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    const result = await knowledgeService.importKnowledge(supabase, items);
    
    if (!result.success && result.message === "No valid items found") {
        return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json(result);

  } catch (e) {
    console.error("Import exception:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}