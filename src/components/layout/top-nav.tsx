import { RssIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import {
  TopNavActions,
  TopNavActionsSkeleton,
} from "@/components/layout/components/top-nav-actions";
import { TopNavItems } from "@/components/layout/components/top-nav-items";
import type { getCurrentSession } from "@/lib/session";

export function TopNav({
  sessionPromise,
}: {
  sessionPromise: ReturnType<typeof getCurrentSession>;
}) {
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
      <Suspense fallback={<TopNavActionsSkeleton />}>
        <TopNavActions sessionPromise={sessionPromise} />
      </Suspense>
    </header>
  );
}
