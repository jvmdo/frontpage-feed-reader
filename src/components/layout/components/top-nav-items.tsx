"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Feed", isDisabled: false },
  {
    href: "/digest",
    label: "Digest",
    isDisabled: true,
    description:
      "An AI-powered summary of your feeds, delivered on your schedule.",
  },
  {
    href: "/discover",
    label: "Discover",
    isDisabled: true,
    description: "Find new feeds and blogs curated by the community.",
  },
];

export function TopNavItems() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1" aria-label="Main navigation">
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        const button = (
          <Button
            key={item.href}
            asChild={!item.isDisabled}
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            disabled={item.isDisabled}
            className={cn(
              "h-8 px-2 text-xs sm:text-sm md:text-base",
              !isActive && "text-muted-foreground hover:text-foreground",
              item.isDisabled && "cursor-not-allowed opacity-50",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        );

        if (item.isDisabled) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <div className="cursor-not-allowed">{button}</div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="flex flex-col gap-1 items-start"
              >
                <p className="font-semibold text-xs uppercase tracking-wider text-primary">
                  In Development
                </p>
                <p>{item.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        return button;
      })}
    </nav>
  );
}
