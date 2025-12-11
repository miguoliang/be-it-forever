import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // 使用 signInWithOtp 发送 OTP 验证码
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      // Handle rate limiting error with friendly message
      if (error.message.includes("For security purposes, you can only request this after")) {
        const match = error.message.match(/(\d+)\s+seconds?/);
        const seconds = match ? parseInt(match[1], 10) : 30;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        let waitTime = "";
        if (minutes > 0) {
          waitTime = `${minutes}分${remainingSeconds > 0 ? `${remainingSeconds}秒` : ""}`;
        } else {
          waitTime = `${seconds}秒`;
        }
        
        return NextResponse.json(
          { 
            error: `为了您的账户安全，请等待 ${waitTime} 后再重新发送验证码。如果您的邮箱没有收到验证码，请检查垃圾邮件文件夹。` 
          },
          { status: 429 } // 429 Too Many Requests
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "验证码已发送到您的邮箱",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "发送验证码失败";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

