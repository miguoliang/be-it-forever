// src/app/api/import-words/route.ts
// 终极版：只导入 knowledge，不给 operator 发卡

import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { words } = await req.json();
  console.log("Received words:", JSON.stringify(words, null, 2));
  console.log("Words count:", words?.length || 0);
  const supabase = await createRouteHandlerClient();

  // 权限校验：仅 operator 可导入
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "operator") {
    return new Response("Forbidden - operator only", { status: 403 });
  }

  try {
    // words 已经是标准化的 WordData 格式
    const knowledgeData = words
      .map((w: { name?: string; description?: string; metadata?: Record<string, unknown> }) => ({
        name: w.name?.trim() || "",
        description: w.description?.trim() || "",
        metadata: w.metadata || {},
      }))
      .filter((k: { name: string }) => k.name && k.name.trim() !== "");

    if (knowledgeData.length === 0) {
      return new Response(JSON.stringify({ error: "没有有效的数据" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Knowledge data:", JSON.stringify(knowledgeData, null, 2));

    // 使用批量插入，SQL 原生 ON CONFLICT DO NOTHING
    // Supabase upsert with ignoreDuplicates 会生成 SQL: INSERT ... ON CONFLICT DO NOTHING
    const { data: inserted, error } = await supabase
      .from("knowledge")
      .upsert(knowledgeData, {
        onConflict: "name",
        ignoreDuplicates: true,
      })
      .select("code");

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: inserted?.length || 0,
        total: knowledgeData.length,
        skipped: knowledgeData.length - (inserted?.length || 0),
        message: `成功导入 ${inserted?.length || 0} 个单词，跳过 ${
          knowledgeData.length - (inserted?.length || 0)
        } 个重复项`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Import failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
