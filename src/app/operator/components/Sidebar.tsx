"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarItem {
  href: string;
  label: string;
  icon?: string;
}

const sidebarItems: SidebarItem[] = [
  { href: "/operator", label: "仪表盘", icon: "📊" },
  { href: "/operator/knowledges", label: "单词列表", icon: "📚" },
  { href: "/operator/import", label: "导入词库", icon: "📥" },
  // Add more sidebar items here as needed
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="p-4 md:p-6">
      <ul className="space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {item.icon && <span className="text-xl">{item.icon}</span>}
                <span className="text-sm md:text-base">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

