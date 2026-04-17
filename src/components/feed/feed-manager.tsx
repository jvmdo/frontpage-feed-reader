"use client";

import { Plus, Rss } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { AddFeedDialog } from "./add-feed-dialog";
import { FeedTable } from "./feed-table";

export function FeedManager() {
  const { data } = useSubscriptions();

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

  return <FeedTable data={data} />;
}
