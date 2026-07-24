import { RssIcon } from "lucide-react";
import Link from "next/link";
import { GuestButton } from "@/components/auth/guest-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto max-w-7xl flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-1 sm:gap-1.5 transition-opacity hover:opacity-90 shrink-0"
        >
          <span className="font-serif text-base xs:text-lg sm:text-2xl font-bold tracking-tighter">
            Frontpage
          </span>
          <RssIcon className="size-4 sm:size-5 text-primary" />
        </Link>

        {/* Center Desktop Navigation (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm lg:text-base font-medium">
          <Link
            href="#features"
            className="transition-colors hover:text-primary"
          >
            Features
          </Link>
          <Link
            href="#testimonials"
            className="transition-colors hover:text-primary"
          >
            Testimonials
          </Link>
          <Link href="#faq" className="transition-colors hover:text-primary">
            FAQ
          </Link>
        </nav>

        {/* Right Actions Container with Optical Kerning / Spacing Balance */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs sm:h-9 sm:text-sm px-2.5 sm:px-3"
            asChild
          >
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <GuestButton
            size="sm"
            className="h-8 text-xs sm:h-9 sm:text-sm px-2.5 sm:px-4"
          />
        </div>
      </div>
    </header>
  );
}
