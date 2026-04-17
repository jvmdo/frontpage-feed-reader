import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { AddFeedDialog } from "@/components/feed/add-feed-dialog";
import { FeedManager } from "@/components/feed/feed-manager";
import { getCurrentSession } from "@/lib/session";

export default async function ManageFeedsPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

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
        <FeedManager />
      </div>
    </div>
  );
}
