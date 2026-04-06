import { Plus, Rss } from "lucide-react";
import { redirect } from "next/navigation";
import { AddFeedDialog } from "@/components/feed/add-feed-dialog";
import { FeedTable } from "@/components/feed/feed-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { getUserSubscriptions } from "@/services/feed";

export default async function ManageFeedsPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const subscriptions = await getUserSubscriptions(db, session.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Manage Feeds
          </h1>
          <p className="text-muted-foreground text-sm">
            View and manage your subscribed content sources.
          </p>
        </div>
        <AddFeedDialog>
          <Plus size={40} className="text-primary" />
        </AddFeedDialog>
      </div>

      <div className="flex-1 rounded-xl border border-border/50 bg-card p-4 shadow-sm md:p-6">
        {subscriptions.length > 0 ? (
          <FeedTable data={subscriptions} />
        ) : (
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
        )}
      </div>
    </div>
  );
}
