"use client";

import { Plus, Rss } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useFeeds } from "@/hooks/feed/use-feeds";
import { AddFeedDialog } from "./add-feed-dialog";
import { FeedTable } from "./feed-table";
import { RefreshTaskStatusBanner } from "./refresh-task-status-banner";

export function FeedManager() {
  const { data } = useFeeds();

  if (data.length === 0) {
    return (
      <EmptyState
        title="No feeds yet"
        description="You haven't subscribed to any RSS feeds. Add your first feed to start reading."
        icon={Rss}
        action={
          <AddFeedDialog asChild>
            <Button>
              <Plus data-icon="inline-start" />
              Add your first feed
            </Button>
          </AddFeedDialog>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <RefreshTaskStatusBanner />
      <FeedTable data={data} />
    </div>
  );
}
