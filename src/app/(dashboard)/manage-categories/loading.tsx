import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-label="Loading categories..."
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Manage Categories
        </h1>
        <p className="text-muted-foreground text-sm">
          Categories organize and structure your feeds.
        </p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: Static list
              key={i}
              className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-32" />
              </div>

              <div className="flex items-center gap-2">
                <Skeleton className="size-9 rounded-md" />
                <Skeleton className="size-9 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
