import { Skeleton } from "@/components/ui/skeleton";

export function ReaderViewSkeleton() {
  return (
    <div aria-busy="true" className="animate-in fade-in duration-500">
      <span className="sr-only" role="status">
        Loading item content
      </span>

      <section
        aria-hidden="true"
        className="flex flex-col gap-4 pt-4 pb-24 px-4 md:px-8"
      >
        <header className="flex flex-col gap-4">
          {/* Title skeleton matching ReaderView's heading sizes */}
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-11/12 md:h-8 xl:h-9" />
            <Skeleton className="h-7 w-3/4 md:h-8 xl:h-9" />
          </div>

          {/* Metadata skeleton matching ReaderView's author, date, bookmark and link */}
          <div className="flex flex-wrap gap-2 items-center justify-between relative -top-3">
            <div className="flex items-center gap-2 h-7">
              <Skeleton className="h-4 w-20" />
              <div className="h-3 w-px bg-border" />
              <Skeleton className="h-4 w-24" />
              <div className="h-3 w-px bg-border" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        </header>

        {/* Content body structure mimicking paragraphs */}
        <div className="flex flex-col gap-6 pt-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[92%]" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[92%]" />
          </div>
        </div>
      </section>
    </div>
  );
}
