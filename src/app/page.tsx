// src/app/page.tsx - Sign In Page
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSendOtp = async () => {
    if (!email) {
      alert("请输入邮箱");
      return;
    }

    setLoading(true);
    try {
      // Supabase signInWithOtp 默认发送 magic link
      // 要发送 OTP 验证码，需要在 Dashboard 中配置 Email 模板包含验证码
      // 或者使用 Admin API 发送自定义 OTP
      // 当前实现：发送 magic link，用户也可以输入邮件中的验证码（如果邮件模板包含）
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error("OTP Error:", error);
        alert(error.message);
        setLoading(false);
        return;
      }

      setOtpSent(true);
      setLoading(false);
      alert("验证码已发送到您的邮箱，请查收。如果邮件中只有链接，请点击链接登录，或检查邮件模板配置。");
    } catch (err: any) {
      console.error("OTP Exception:", err);
      alert(err.message || "发送验证码失败，请检查网络连接");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      alert("请输入验证码");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // ← 关键跳转逻辑
    if (data.user?.user_metadata?.role === "operator") {
      router.push("/operator");
    } else {
      router.push("/learn");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
      <div className="max-w-md md:max-w-lg lg:max-w-xl w-full mx-auto p-5 md:p-8 lg:p-10 text-center box-border">
        <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
          背它一辈子
        </h1>
        <h2 className="mb-6 md:mb-8 lg:mb-10 text-gray-600 dark:text-gray-400 text-lg sm:text-xl md:text-2xl lg:text-3xl">
          登录
        </h2>
        <Input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={otpSent}
          className="w-full py-3.5 md:py-4 lg:py-5 px-4 md:px-5 my-2.5 md:my-3 text-base md:text-lg"
        />
        {otpSent && (
          <Input
            type="text"
            placeholder="请输入验证码"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full py-3.5 md:py-4 lg:py-5 px-4 md:px-5 my-2.5 md:my-3 text-base md:text-lg"
          />
        )}
        <div className="my-6 md:my-8">
          {!otpSent ? (
            <Button
              onClick={handleSendOtp}
              disabled={loading}
              size="lg"
              className="w-full py-3.5 md:py-4 lg:py-5 px-6 md:px-8 min-h-[48px] md:min-h-[52px] touch-manipulation"
            >
              {loading ? "发送中..." : "发送验证码"}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleVerifyOtp}
                disabled={loading}
                size="lg"
                className="w-full py-3.5 md:py-4 lg:py-5 px-6 md:px-8 min-h-[48px] md:min-h-[52px] touch-manipulation"
              >
                {loading ? "验证中..." : "验证登录"}
              </Button>
              <Button
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                }}
                variant="ghost"
                className="w-full mt-3"
              >
                重新发送验证码
              </Button>
            </>
          )}
        </div>
        <div className="mt-5 md:mt-6 text-gray-600 dark:text-gray-400 text-sm md:text-base">
          首次使用？输入邮箱即可自动创建账号
        </div>
      </div>
    </div>
  );
}
