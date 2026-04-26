"use client";

import { PlusIcon, RssIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AddFeedDialog } from "@/components/feed/add-feed-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Feed" },
  { href: "/digest", label: "Digest" },
  { href: "/discover", label: "Discover" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="h-14 border-b border-border flex items-center justify-between md:justify-start gap-6 px-3 sm:px-5">
      {/* Left: Logo + Name */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 shrink-0 truncate"
        aria-label="Frontpage home"
      >
        <div className="bg-primary text-surface flex size-7 items-center justify-center rounded-lg">
          <RssIcon className="size-4" />
        </div>
        <span className="sm:hidden text-lg font-bold tracking-tight">Fage</span>
        <span className="hidden sm:block text-lg font-bold tracking-tight">
          Frontpage
        </span>
      </Link>

      {/* Nav links: Right-aligned on mobile, Left-aligned on tablet+ */}
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

      {/* Desktop-only utilities (Search input grows) */}
      <div className="hidden md:flex flex-1 items-center justify-end gap-3">
        <button
          type="button"
          className="flex items-center flex-1 max-w-[16rem] gap-2 bg-accent rounded-md px-3 py-1.5 hover:bg-accent-hover/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Search articles"
        >
          <SearchIcon className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground truncate">
            Search articles...
          </span>
          <Kbd className="ml-auto hidden lg:inline-flex">/</Kbd>
        </button>
        <AddFeedDialog asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 bg-accent text-muted-foreground hover:text-surface hover:bg-accent-hover"
            aria-label="Add feed"
          >
            <PlusIcon className="size-4" />
          </Button>
        </AddFeedDialog>
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
            MS
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
