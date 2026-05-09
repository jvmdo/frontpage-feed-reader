import { RssIcon } from "lucide-react";
import Link from "next/link";
import { GuestButton } from "@/components/auth/guest-button";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-2 sm:px-4 md:px-6">
        <Link href="/" className="flex">
          <span className="font-serif text-lg sm:text-2xl font-bold tracking-tighter">
            Frontpage
          </span>
          <RssIcon size={20} className="text-primary" />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium md:text-base">
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
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <GuestButton />
        </div>
      </div>
    </header>
  );
}
