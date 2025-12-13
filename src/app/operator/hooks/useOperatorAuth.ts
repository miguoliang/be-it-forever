import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export function useOperatorAuth() {
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

  return { user, loading, supabase };
}

