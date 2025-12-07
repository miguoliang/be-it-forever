"use client";

interface TopNavProps {
  userEmail: string;
  onSignOut: () => void;
}

export function TopNav({ userEmail, onSignOut }: TopNavProps) {
  return (
    <div className="flex justify-between items-center px-6 py-4">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        运营后台
      </h1>
      <div className="flex items-center gap-4 md:gap-6">
        <div className="text-sm md:text-base text-muted-foreground">
          {userEmail} · <span className="text-primary font-semibold">operator</span>
        </div>
        <button
          onClick={onSignOut}
          className="px-4 md:px-6 py-2 md:py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm md:text-base font-medium transition-colors"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}

