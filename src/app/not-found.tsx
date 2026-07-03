import { FileQuestionIcon, HomeIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background p-6">
      <div className="flex max-w-md flex-col items-center text-center gap-6">
        <div className="flex size-24 items-center justify-center rounded-full bg-muted/50 text-muted-foreground ring-1 ring-border/50 shadow-sm">
          <FileQuestionIcon className="size-10" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            404
          </h1>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Page not found
          </h2>
          <p className="text-muted-foreground leading-relaxed mt-2">
            Sorry, we couldn't find the page you're looking for. It might have
            been moved, or the link you followed may be broken.
          </p>
        </div>

        <Button asChild size="lg" className="mt-4 rounded-full px-8">
          <Link href="/">
            <HomeIcon className="mr-2 size-4" />
            Return to Homepage
          </Link>
        </Button>
      </div>
    </div>
  );
}
