import Link from "next/link";
import { GuestButton } from "@/components/auth/guest-button";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden bg-primary">
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center text-primary-foreground space-y-8">
        <h2 className="font-serif text-4xl md:text-6xl tracking-tight max-w-3xl mx-auto">
          Start your personalized reading journey today
        </h2>
        <p className="text-xl leading-relaxed opacity-90 max-w-xl mx-auto">
          Try it as a guest to see if you like the experience. No credit card,
          no sign-up wall.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <GuestButton
            size="lg"
            variant="secondary"
            className="h-14 px-8 text-lg rounded-full"
          />
          <Button
            asChild={true}
            size="lg"
            variant="ghost"
            className="h-14 px-8 text-lg rounded-full"
          >
            <Link href="/login">Create Account</Link>
          </Button>
        </div>
      </div>

      {/* Decorative background circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-white/10 blur-[100px] rounded-full" />
    </section>
  );
}
