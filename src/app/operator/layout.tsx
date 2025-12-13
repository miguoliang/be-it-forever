"use client";

import { DashboardLayout } from "./components/DashboardLayout";
import { TopNav } from "./components/TopNav";
import { Sidebar } from "./components/Sidebar";
import { useOperatorAuth } from "./hooks/useOperatorAuth";

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, supabase } = useOperatorAuth();

  // Redirect is handled by the hook
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-3xl font-medium">校验权限中…</div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Redirect handled by hook onAuthStateChange
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

