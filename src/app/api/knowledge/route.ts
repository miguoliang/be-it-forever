// src/app/api/knowledge/route.ts
import { createRouteHandlerClient } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

// Define types for the request body
interface KnowledgeItem {
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface ImportRequest {
  items: KnowledgeItem[];
}

export async function GET() {
  const supabase = await createRouteHandlerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  // Check if user is operator
  if (user.user_metadata?.role !== 'operator') {
    return NextResponse.json({ error: '权限不足' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('knowledge')
    .select('code, name, description, metadata, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    let items: KnowledgeItem[] = [];
    
    try {
      const body = await req.json();
      // Handle both array input and wrapped input
      if (Array.isArray(body)) {
        items = body;
      } else if (body && Array.isArray(body.items)) {
        items = body.items;
      } else if (body && Array.isArray(body.words)) {
        // Backward compatibility for "words" key
        items = body.words; 
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

    if (authError || !user || user.user_metadata?.role !== "operator") {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Validate and transform
    const validItems = items
      .map((item) => {
        if (!item || typeof item !== 'object' || !item.name) return null;
        
        return {
          name: item.name.trim(),
          description: item.description?.trim() || "",
          metadata: item.metadata || {},
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && item.name.length > 0);

    if (validItems.length === 0) {
      return NextResponse.json(
        { error: "No valid items found" },
        { status: 400 }
      );
    }

    // Upsert
    const { data: inserted, error } = await supabase
      .from("knowledge")
      .upsert(validItems, {
        onConflict: "name",
        ignoreDuplicates: true,
      })
      .select("code");

    if (error) {
      console.error("Import error:", error);
      throw error;
    }

    const insertedCount = inserted?.length || 0;
    const skippedCount = validItems.length - insertedCount;

    return NextResponse.json({
      success: true,
      count: insertedCount,
      total: validItems.length,
      skipped: skippedCount,
      message: `Successfully imported ${insertedCount} items. ${skippedCount} duplicates skipped.`,
    });

  } catch (e) {
    console.error("Import exception:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}