"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Feed" },
  { href: "/digest", label: "Digest" },
  { href: "/discover", label: "Discover" },
];

export function TopNavItems() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1" aria-label="Main navigation">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Button
            asChild={true}
            key={item.href}
            variant={isActive ? "secondary" : "ghost"}
            aria-current={isActive ? "page" : undefined}
            size="sm"
            className={cn(
              "h-8 px-2 text-xs sm:text-sm md:text-base",
              !isActive && "text-muted-foreground hover:text-foreground",
            )}
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        );
      })}
    </nav>
  );
}
