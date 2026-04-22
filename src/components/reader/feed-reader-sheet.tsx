"use client";

import { AlertCircleIcon } from "lucide-react";
import { ReaderView } from "@/components/reader/reader-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveItem } from "@/hooks/use-active-item";
import { useFeedItem } from "@/hooks/use-feed-item";

export function FeedReaderSheet() {
  const { activeItemId, setActiveItemId } = useActiveItem();
  const { data, isLoading, error } = useFeedItem(activeItemId);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setActiveItemId(null);
    }
  };

  return (
    <Sheet open={!!activeItemId} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-[90vw] md:max-w-2xl lg:max-w-3xl xl:max-w-5xl 2xl:max-w-6xl overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>Article Reader</SheetTitle>
          <SheetDescription>
            Read the full content of the selected article.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <ReaderSkeleton />
        ) : error ? (
          <div className="p-8">
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Failed to load article"}
              </AlertDescription>
            </Alert>
          </div>
        ) : data ? (
          <ReaderView data={data} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function ReaderSkeleton() {
  return (
    <div className="flex flex-col gap-8 py-8 px-4 md:px-8">
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
  );
}
