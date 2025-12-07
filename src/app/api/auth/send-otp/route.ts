import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // 使用 signInWithOtp 发送 OTP
    // 注意：Supabase 默认发送 magic link，要发送 OTP 验证码需要在 Dashboard 配置
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "验证码已发送到您的邮箱",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "发送验证码失败" },
      { status: 500 }
    );
  }
}

