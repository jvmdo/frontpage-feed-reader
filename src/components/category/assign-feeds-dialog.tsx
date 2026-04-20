"use client";

import { CheckIcon, Loader2Icon, MoveRightIcon } from "lucide-react";
import { toast } from "sonner";
import { FeedIcon } from "@/components/feed/feed-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCategories } from "@/hooks/use-categories";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useUpdateSubscription } from "@/hooks/use-update-subscription";
import { cn } from "@/lib/utils";

interface AssignFeedsDialogProps {
  categoryId: number;
  children: React.ReactNode;
}

export function AssignFeedsDialog({
  categoryId,
  children,
}: AssignFeedsDialogProps) {
  const { data: subscriptions } = useSubscriptions();
  const { data: categories } = useCategories();
  const { mutate: updateSubscription, isPending } = useUpdateSubscription();

  const targetCategory = categories.find((c) => c.id === categoryId);
  const targetCategoryName = targetCategory?.name || "this category";

  const handleMove = (subscriptionId: number) => {
    updateSubscription(
      {
        id: subscriptionId,
        categoryId,
      },
      {
        onSuccess: () => {
          toast.success("Feed moved to category");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to move feed");
        },
      },
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Assign feeds to {targetCategoryName}
          </DialogTitle>
          <DialogDescription>
            Select which feeds you want to move into this category.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-80">
          <div className="flex flex-col gap-2">
            {subscriptions.map((subscription) => {
              const { subscription: sub, feed } = subscription;
              const isAlreadyIn = sub.categoryId === categoryId;
              const currentCategory = categories.find(
                (c) => c.id === sub.categoryId,
              );
              const title = sub.customTitle || feed.title || "Untitled Feed";

              return (
                <div
                  key={sub.id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-border/50 p-3"
                >
                  <FeedIcon
                    url={feed.iconUrl || feed.url}
                    title={title}
                    size={24}
                  />
                  <div className="flex flex-col min-w-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate text-sm font-medium">
                          {title}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{title}</TooltipContent>
                    </Tooltip>
                    <span
                      className={cn(
                        "mt-0.5 text-xs",
                        currentCategory
                          ? "truncate max-w-50"
                          : "text-muted-foreground",
                      )}
                    >
                      {currentCategory ? currentCategory.name : "Uncategorized"}
                    </span>
                  </div>

                  {isAlreadyIn ? (
                    <Badge variant="outline" className="h-6">
                      <CheckIcon className="mr-1 size-3 mt-0.5" />
                      In Category
                    </Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => handleMove(sub.id)}
                      disabled={isPending}
                      aria-label={`Move ${title} to ${targetCategoryName}`}
                    >
                      {isPending ? (
                        <>
                          <Loader2Icon
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                          <span className="sr-only">Moving {title}...</span>
                        </>
                      ) : (
                        <>
                          Move
                          <MoveRightIcon className="ml-2 size-3" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
