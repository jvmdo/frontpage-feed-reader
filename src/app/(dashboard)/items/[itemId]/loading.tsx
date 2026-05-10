import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function ItemLoading() {
  return (
    <div className="flex flex-col h-full bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <Skeleton className="h-8 w-32" />
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl">
          <ReaderSkeleton />
        </div>
      </main>
    </div>
  );
}

function ReaderSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        Loading item content
      </span>

      <div aria-hidden="true" className="flex flex-col gap-8 py-8 px-4 md:px-8">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <span className="opacity-40">•</span>
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>

        <Skeleton className="h-4 w-24" />

        <Separator />

        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[95%]" />
        </div>
      </div>
    </div>
  );
}
