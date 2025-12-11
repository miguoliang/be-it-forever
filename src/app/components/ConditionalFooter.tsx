"use client";

import { usePathname } from "next/navigation";
import { NavigationFooter } from "./NavigationFooter";

// Routes that should show the navigation footer
const FOOTER_ROUTES = ["/learn", "/stats"];

export function ConditionalFooter() {
  const pathname = usePathname();
  const shouldShowFooter = pathname && FOOTER_ROUTES.includes(pathname);

  if (!shouldShowFooter) return null;

  return <NavigationFooter />;
}

