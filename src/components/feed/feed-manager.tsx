"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Rss } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { AddFeedDialog } from "./add-feed-dialog";
import { FeedTable } from "./feed-table";

export function FeedManager() {
  // We use useQuery purely for state management of the subscriptions list.
  // All updates are handled manually via setQueryData in mutation hooks.
  const { data } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => [],
    enabled: false,
  });

  if (!data || data.length === 0) {
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
