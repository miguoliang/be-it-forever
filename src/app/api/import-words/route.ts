// src/app/api/import-words/route.ts
// 终极版：只导入 knowledge，不给 operator 发卡

import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    let words;
    try {
      const body = await req.json();
      words = body.words;
    } catch {
      return NextResponse.json(
        { error: "无效的请求数据格式" },
        { status: 400 }
      );
    }

    if (!Array.isArray(words)) {
      return NextResponse.json(
        { error: "words 必须是数组" },
        { status: 400 }
      );
    }

    if (words.length === 0) {
      return NextResponse.json(
        { error: "没有要导入的数据" },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();

    // 权限校验：仅 operator 可导入
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== "operator") {
      return NextResponse.json(
        { error: "权限不足，仅 operator 可导入" },
        { status: 403 }
      );
    }

    // words 已经是标准化的 WordData 格式
    const knowledgeData = words
      .map((w: { name?: string; description?: string; metadata?: Record<string, unknown> }) => ({
        name: w.name?.trim() || "",
        description: w.description?.trim() || "",
        metadata: w.metadata || {},
      }))
      .filter((k: { name: string }) => k.name && k.name.trim() !== "");

    if (knowledgeData.length === 0) {
      return NextResponse.json(
        { error: "没有有效的数据" },
        { status: 400 }
      );
    }

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
      console.error("Import words error:", error);
      throw error;
    }

    const insertedCount = inserted?.length || 0;
    const skippedCount = knowledgeData.length - insertedCount;

    return NextResponse.json({
      success: true,
      count: insertedCount,
      total: knowledgeData.length,
      skipped: skippedCount,
      message: `成功导入 ${insertedCount} 个单词${skippedCount > 0 ? `，跳过 ${skippedCount} 个重复项` : ""}`,
    });
  } catch (e) {
    console.error("Import words exception:", e);
    const errorMessage =
      e instanceof Error ? e.message : "导入失败";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
