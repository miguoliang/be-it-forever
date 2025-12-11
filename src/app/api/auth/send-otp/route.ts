import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import {
  isRateLimitError,
  getRateLimitErrorMessage,
} from "@/lib/utils/errorHandling";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
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
      if (isRateLimitError(error.message)) {
        return NextResponse.json(
          {
            error: getRateLimitErrorMessage(error.message, "重新发送验证码"),
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
    console.error("Send OTP error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "发送验证码失败";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

