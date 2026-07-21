import { RssIcon } from "lucide-react";
import Link from "next/link";
import { TopNavActions } from "@/components/layout/components/top-nav-actions";
import { TopNavItems } from "@/components/layout/components/top-nav-items";
import type { SessionUser } from "@/lib/auth-client";

interface TopNavProps {
  user: SessionUser;
}

export function TopNav({ user }: TopNavProps) {
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
        <span className="text-[clamp(1rem,0.886rem+0.57vw,1.25rem)] font-bold tracking-tight">
          Frontpage
        </span>
      </Link>

      {/* Nav links: Right-aligned on mobile, Left-aligned on tablet+ */}
      <TopNavItems />

      {/* Desktop-only utilities (Search input grows) */}
      <TopNavActions user={user} />
    </header>
  );
}
