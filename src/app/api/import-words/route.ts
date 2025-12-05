// src/app/api/import-words/route.ts
// 终极版：只导入 knowledge，不给 operator 发卡

import { createRouteHandlerClient } from '@/lib/supabaseServer'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { words } = await req.json()
  const supabase = await createRouteHandlerClient()

  // 权限校验：仅 operator 可导入
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'operator') {
    return new Response('Forbidden - operator only', { status: 403 })
  }

  try {
    const knowledgeData = words.map((w: any) => ({
      name: w['English Word']?.trim(),
      description: w['Chinese Translation']?.trim() || '',
      metadata: {
        pos: w.POS || null,
        level: w.Level || null,
        example: w['Example Sentence'] || null,
        prompt: w['Self-Examine Prompt'] || null,
        theme: w.Theme || null,
      },
    })).filter((k: { name: string | undefined }) => k.name)

    const { data: inserted, error } = await supabase
      .from('knowledge')
      .insert(knowledgeData)
      .select('code')   // 自动生成 ST-XXXXXXX

    if (error) throw error

    // ← 完全不发卡！只导入词库
    // 以后用户注册时会自动拿到所有 knowledge 的卡片（靠你之前写的匿名注册触发器）

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: inserted!.length,
        message: '词库导入成功，新用户注册后将自动获得这些卡片'
      }),
      { status: 200 }
    )
  } catch (e: any) {
    return new Response(e.message || 'Import failed', { status: 500 })
  }
}