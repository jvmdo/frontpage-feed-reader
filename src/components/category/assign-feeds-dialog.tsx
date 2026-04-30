"use client";

import { MoveRightIcon, XIcon } from "lucide-react";
import type * as React from "react";
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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { useCategories } from "@/hooks/category/use-categories";
import { useFeeds } from "@/hooks/feed/use-feeds";
import { useUpdateFeed } from "@/hooks/feed/use-update-feed";
import type { FeedWithSubscription } from "@/types";

interface AssignFeedsDialogProps {
  categoryId: number;
  children: React.ReactNode;
}

export function AssignFeedsDialog({
  categoryId,
  children,
}: AssignFeedsDialogProps) {
  const { data: subscriptions } = useFeeds();
  const { data: categories } = useCategories();

  const targetCategory = categories.find((c) => c.id === categoryId);
  const targetCategoryName = targetCategory?.name || "this category";

  const currentCategoryFeeds = subscriptions.filter(
    (s) => s.subscription.categoryId === categoryId,
  );
  const availableFeeds = subscriptions.filter(
    (s) => s.subscription.categoryId !== categoryId,
  );

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

        <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto">
          {currentCategoryFeeds.length > 0 && (
            <section
              className="flex flex-col gap-3"
              aria-labelledby="current-feeds-header"
            >
              <h3
                id="current-feeds-header"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                In this category
              </h3>
              <ItemGroup>
                {currentCategoryFeeds.map((item) => (
                  <AssignedFeedItem key={item.subscription.id} item={item} />
                ))}
              </ItemGroup>
            </section>
          )}

          <section
            className="flex flex-col gap-3"
            aria-labelledby="available-feeds-header"
          >
            <h3
              id="available-feeds-header"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Available feeds
            </h3>
            {availableFeeds.length === 0 ? (
              <p className="text-sm text-muted-foreground italic px-1">
                No other feeds available.
              </p>
            ) : (
              <ItemGroup>
                {availableFeeds.map((item) => {
                  const currentCat = categories.find(
                    (c) => c.id === item.subscription.categoryId,
                  );

                  return (
                    <AvailableFeedItem
                      key={item.subscription.id}
                      item={item}
                      categoryId={categoryId}
                      currentCategoryName={currentCat?.name}
                    />
                  );
                })}
              </ItemGroup>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssignedFeedItem({ item }: { item: FeedWithSubscription }) {
  const { mutate, isPending } = useUpdateFeed();

  const handleUnassign = () => {
    mutate(
      { id: item.subscription.id, categoryId: null },
      {
        onSuccess: () => toast.success("Feed removed from category"),
        onError: (error) =>
          toast.error(error.message || "Failed to remove feed"),
      },
    );
  };

  const title = item.subscription.customTitle || item.feed.title || "Untitled";

  return (
    <FeedItemBase item={item} description="Currently in this category">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 hover:bg-destructive/10 hover:text-destructive"
        onClick={handleUnassign}
        disabled={isPending}
        aria-label={`Remove ${title} from category`}
      >
        {isPending ? (
          <>
            <Spinner />
            <span className="sr-only">Removing...</span>
          </>
        ) : (
          <>
            Remove
            <XIcon data-icon="inline-end" />
          </>
        )}
      </Button>
    </FeedItemBase>
  );
}

function AvailableFeedItem({
  item,
  categoryId,
  currentCategoryName,
}: {
  item: FeedWithSubscription;
  categoryId: number;
  currentCategoryName?: string;
}) {
  const { mutate, isPending } = useUpdateFeed();

  const handleAssign = () => {
    mutate(
      { id: item.subscription.id, categoryId },
      {
        onSuccess: () => toast.success("Feed moved to category"),
        onError: (error) => toast.error(error.message || "Failed to move feed"),
      },
    );
  };

  const title = item.subscription.customTitle || item.feed.title || "Untitled";

  return (
    <FeedItemBase
      item={item}
      description={currentCategoryName || "Uncategorized"}
    >
      <Button
        variant="ghost"
        size="sm"
        className="h-8"
        onClick={handleAssign}
        disabled={isPending}
        aria-label={`Move ${title} to category`}
      >
        {isPending ? (
          <>
            <Spinner />
            <span className="sr-only">Moving...</span>
          </>
        ) : (
          <>
            Move
            <MoveRightIcon data-icon="inline-end" />
          </>
        )}
      </Button>
    </FeedItemBase>
  );
}

function FeedItemBase({
  item,
  description,
  children,
}: {
  item: FeedWithSubscription;
  description: string;
  children: React.ReactNode;
}) {
  const { subscription: sub, feed } = item;
  const title = sub.customTitle || feed.title || "Untitled Feed";

  return (
    <Item variant="outline" size="sm">
      <ItemMedia variant="image">
        <FeedIcon url={feed.iconUrl || feed.url} title={title} size={24} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>{description}</ItemDescription>
      </ItemContent>
      <ItemActions>{children}</ItemActions>
    </Item>
  );
}
