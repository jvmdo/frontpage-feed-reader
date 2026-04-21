"use client";

import { Loader2Icon, MoveRightIcon, XIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { FeedIcon } from "@/components/feed/feed-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCategories } from "@/hooks/use-categories";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useUpdateSubscription } from "@/hooks/use-update-subscription";
import { cn } from "@/lib/utils";
import type { Category, FeedWithSubscription } from "@/types";

interface AssignFeedsDialogProps {
  categoryId: number;
  children: React.ReactNode;
}

export function AssignFeedsDialog({
  categoryId,
  children,
}: AssignFeedsDialogProps) {
  const { data: subscriptions = [] } = useSubscriptions();
  const { data: categories = [] } = useCategories();
  const { mutate: updateSubscription, isPending } = useUpdateSubscription();

  const targetCategory = categories.find((c) => c.id === categoryId);
  const targetCategoryName = targetCategory?.name || "this category";

  const { currentCategoryFeeds, availableFeeds } = React.useMemo(() => {
    return {
      currentCategoryFeeds: subscriptions.filter(
        (s) => s.subscription.categoryId === categoryId,
      ),
      availableFeeds: subscriptions.filter(
        (s) => s.subscription.categoryId !== categoryId,
      ),
    };
  }, [subscriptions, categoryId]);

  const handleAction = (subscriptionId: number, targetCatId?: number) => {
    const isUnassign = targetCatId === undefined;

    updateSubscription(
      { id: subscriptionId, categoryId: targetCatId },
      {
        onSuccess: () => {
          toast.success(
            isUnassign
              ? "Feed removed from category"
              : "Feed moved to category",
          );
        },
        onError: (error) => {
          toast.error(
            error.message || `Failed to ${isUnassign ? "remove" : "move"} feed`,
          );
        },
      },
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col max-h-[80vh] min-h-75 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Manage feeds in {targetCategoryName}
          </DialogTitle>
          <DialogDescription>
            Add feeds to this category or remove them to move them to
            Uncategorized.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 flex-1 min-h-0 pr-4 overflow-y-auto">
          {currentCategoryFeeds.length > 0 && (
            <FeedListSection
              id="current-feeds-list"
              title="In this category"
              items={currentCategoryFeeds}
              isPending={isPending}
              onAction={(id) => handleAction(id)}
              actionType="unassign"
            />
          )}

          <FeedListSection
            id="available-feeds-list"
            title="Available feeds"
            items={availableFeeds}
            isPending={isPending}
            onAction={(id) => handleAction(id, categoryId)}
            actionType="assign"
            emptyMessage="No other feeds available."
            categories={categories}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface FeedListSectionProps {
  title: string;
  id: string;
  items: FeedWithSubscription[];
  isPending: boolean;
  onAction: (id: number) => void;
  actionType: "assign" | "unassign";
  emptyMessage?: string;
  categories?: Category[];
}

function FeedListSection({
  title,
  id,
  items,
  isPending,
  onAction,
  actionType,
  emptyMessage,
  categories,
}: FeedListSectionProps) {
  const headerId = `${id}-header`;

  return (
    <section className="flex flex-col gap-3" aria-labelledby={headerId}>
      <h3
        id={headerId}
        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {title}
      </h3>

      {items.length === 0 && emptyMessage ? (
        <p className="text-sm text-muted-foreground italic px-1">
          {emptyMessage}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const currentCat = categories?.find(
              (c) => c.id === item.subscription.categoryId,
            );
            return (
              <li key={item.subscription.id}>
                <FeedItemRow
                  item={item}
                  isPending={isPending}
                  onAction={() => onAction(item.subscription.id)}
                  actionType={actionType}
                  currentCategoryName={currentCat?.name}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function FeedItemRow({
  item,
  isPending,
  onAction,
  actionType,
  currentCategoryName,
}: {
  item: FeedWithSubscription;
  isPending: boolean;
  onAction: () => void;
  actionType: "assign" | "unassign";
  currentCategoryName?: string;
}) {
  const { subscription: sub, feed } = item;
  const title = sub.customTitle || feed.title || "Untitled Feed";

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors">
      <FeedIcon url={feed.iconUrl || feed.url} title={title} size={24} />

      <div className="flex flex-col min-w-0">
        <span className="truncate text-sm font-medium cursor-default">
          {title}
        </span>
        <span className="mt-0.5 truncate text-xs text-muted-foreground">
          {actionType === "unassign"
            ? "Currently in this category"
            : currentCategoryName || "Uncategorized"}
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "whitespace-nowrap h-8",
          actionType === "unassign" &&
            "hover:text-destructive hover:bg-destructive/10",
        )}
        onClick={onAction}
        disabled={isPending}
        aria-label={
          actionType === "unassign"
            ? `Remove ${title} from category`
            : `Move ${title} to category`
        }
      >
        {isPending ? (
          <div className="flex items-center gap-2">
            <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">
              {actionType === "unassign" ? "Removing..." : "Moving..."}
            </span>
          </div>
        ) : actionType === "unassign" ? (
          <>
            Remove
            <XIcon className="ml-2 size-3" />
          </>
        ) : (
          <>
            Move
            <MoveRightIcon className="ml-2 size-3" />
          </>
        )}
      </Button>
    </div>
  );
}
