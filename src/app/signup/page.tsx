// src/app/signup/page.tsx - Sign Up Page
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSignup = async () => {
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else if (data.user?.user_metadata?.role === "operator") {
      router.push("/operator");
    } else {
      router.push("/learn");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
      <div className="max-w-md md:max-w-lg lg:max-w-xl w-full mx-auto p-5 md:p-8 lg:p-10 text-center box-border">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2.5 md:mb-4 text-gray-900 dark:text-white">
          英语学习工具
        </h1>
        <h2 className="mb-6 md:mb-8 lg:mb-10 text-gray-600 dark:text-gray-400 text-lg sm:text-xl md:text-2xl lg:text-3xl">
          注册
        </h2>
        <Input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full py-3.5 md:py-4 lg:py-5 px-4 md:px-5 my-2.5 md:my-3 text-base md:text-lg"
        />
        <Input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full py-3.5 md:py-4 lg:py-5 px-4 md:px-5 my-2.5 md:my-3 text-base md:text-lg"
        />
        <div className="my-6 md:my-8">
          <Button
            onClick={handleSignup}
            disabled={loading}
            size="lg"
            className="w-full py-3.5 md:py-4 lg:py-5 px-6 md:px-8 min-h-[48px] md:min-h-[52px] touch-manipulation"
          >
            {loading ? "注册中..." : "注册"}
          </Button>
        </div>
        <div className="mt-5 md:mt-6 text-gray-600 dark:text-gray-400 text-sm md:text-base">
          已有账号？{" "}
          <Link
            href="/"
            className="text-primary no-underline font-medium hover:underline"
          >
            立即登录
          </Link>
        </div>
      </div>
    </div>
  );
}
