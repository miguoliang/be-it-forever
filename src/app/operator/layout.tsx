"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "./components/DashboardLayout";
import { TopNav } from "./components/TopNav";
import { Sidebar } from "./components/Sidebar";

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkOperator = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        router.replace("/learn");
        return;
      }

      if (data.user.user_metadata?.role !== "operator") {
        router.replace("/learn");
        return;
      }

      setUser(data.user);
      setLoading(false);
    };

    checkOperator();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session?.user?.user_metadata?.role === "operator") {
            setUser(session.user);
            setLoading(false);
          } else {
            router.replace("/learn");
          }
        }
        if (event === "SIGNED_OUT") {
          router.replace("/");
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [router, supabase]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-3xl font-medium">校验权限中…</div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <DashboardLayout
      topNav={<TopNav userEmail={user.email || ""} onSignOut={handleSignOut} />}
      sidebar={<Sidebar />}
    >
      {children}
    </DashboardLayout>
  );
}

