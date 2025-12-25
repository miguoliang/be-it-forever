import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import {
  isRateLimitError,
  getRateLimitErrorMessage,
} from "@/lib/utils/errorHandling";
import { ApiError, handleApiError, apiSuccess } from "@/lib/utils/apiError";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      throw ApiError.validationError("邮箱不能为空");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw ApiError.validationError("邮箱格式不正确");
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
        // Handle rate limit specifically as it needs custom message parsing
        return NextResponse.json(
          {
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: getRateLimitErrorMessage(error.message, "重新发送验证码")
            }
          },
          { status: 429 } 
        );
      }
      throw ApiError.validationError(error.message);
    }

    return apiSuccess({
      success: true,
      message: "验证码已发送到您的邮箱",
    });
  } catch (error) {
    return handleApiError(error);
  }
}