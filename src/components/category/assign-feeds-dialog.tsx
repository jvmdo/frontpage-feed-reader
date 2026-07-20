"use client";

import { MoveRightIcon, XIcon } from "lucide-react";
import type * as React from "react";
import { toast } from "sonner";
import { AddFeedDialog } from "@/components/feed/add-feed-dialog";
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
  const { data: feeds } = useFeeds();
  const { data: categories } = useCategories();

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const targetCategoryName =
    categoryById.get(categoryId)?.name ?? "this category";

  const categoryFeeds = feeds.filter(
    (feed) => feed.subscription.categoryId === categoryId,
  );
  const availableFeeds = feeds.filter(
    (feed) => feed.subscription.categoryId !== categoryId,
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

        <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto -mr-6 pr-6">
          {feeds.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm text-muted-foreground italic">
                No feeds available yet.
              </p>
              <AddFeedDialog asChild>
                <Button size="sm">Add a feed</Button>
              </AddFeedDialog>
            </div>
          ) : (
            <>
              {categoryFeeds.length > 0 && (
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
                    {categoryFeeds.map((feed) => {
                      const title = getFeedTitle(feed);

                      return (
                        <CategoryFeed
                          key={feed.subscription.id}
                          feedWithSub={feed}
                          description="Currently in this category"
                        >
                          <AssignedFeedAction
                            feedId={feed.subscription.id}
                            title={title}
                          />
                        </CategoryFeed>
                      );
                    })}
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
                    {availableFeeds.map((feed) => {
                      const title = getFeedTitle(feed);
                      const category =
                        feed.subscription.categoryId !== null
                          ? categoryById.get(feed.subscription.categoryId)
                          : undefined;

                      return (
                        <CategoryFeed
                          key={feed.subscription.id}
                          feedWithSub={feed}
                          description={category?.name || "Uncategorized"}
                        >
                          <AvailableFeedAction
                            feedId={feed.subscription.id}
                            title={title}
                            targetCategoryId={categoryId}
                          />
                        </CategoryFeed>
                      );
                    })}
                  </ItemGroup>
                )}
              </section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssignedFeedAction({
  feedId,
  title,
}: {
  feedId: number;
  title: string;
}) {
  const { mutate, isPending } = useUpdateFeed();

  const handleUnassign = () => {
    mutate(
      { id: feedId, categoryId: null },
      {
        onSuccess: () => toast.success("Feed removed from category"),
        onError: (error) =>
          toast.error(error.message || "Failed to remove feed"),
      },
    );
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 hover:bg-destructive/10 hover:text-destructive"
      onClick={handleUnassign}
      disabled={isPending}
      aria-label={`Remove ${title} from category`}
    >
      {isPending ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <XIcon data-icon="inline-start" />
      )}
      {isPending ? "Removing..." : "Remove"}
    </Button>
  );
}

function AvailableFeedAction({
  feedId,
  title,
  targetCategoryId,
}: {
  feedId: number;
  title: string;
  targetCategoryId: number;
}) {
  const { mutate, isPending } = useUpdateFeed();

  const handleAssign = () => {
    mutate(
      { id: feedId, categoryId: targetCategoryId },
      {
        onSuccess: () => toast.success("Feed moved to category"),
        onError: (error) => toast.error(error.message || "Failed to move feed"),
      },
    );
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8"
      onClick={handleAssign}
      disabled={isPending}
      aria-label={`Move ${title} to category`}
    >
      {isPending ? "Moving..." : "Move"}
      {isPending ? (
        <Spinner data-icon="inline-end" />
      ) : (
        <MoveRightIcon data-icon="inline-end" />
      )}
    </Button>
  );
}

function CategoryFeed({
  feedWithSub,
  description,
  children,
}: {
  feedWithSub: FeedWithSubscription;
  description: string;
  children: React.ReactNode;
}) {
  const { feed } = feedWithSub;
  const title = getFeedTitle(feedWithSub);

  return (
    <Item variant="outline" size="sm">
      <ItemMedia variant="image">
        <FeedIcon url={feed.iconUrl || feed.url} title={title} size={24} />
      </ItemMedia>
      <ItemContent className="flex-3">
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>{description}</ItemDescription>
      </ItemContent>
      <ItemActions className="flex-1 justify-end">{children}</ItemActions>
    </Item>
  );
}

function getFeedTitle(feed: FeedWithSubscription) {
  return feed.subscription.customTitle || feed.feed.title || "Untitled";
}
