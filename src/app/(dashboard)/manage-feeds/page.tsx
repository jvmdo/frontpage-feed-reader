import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AddFeedDialog } from "@/components/feed/add-feed-dialog";
import { FeedManager } from "@/components/feed/feed-manager";
import { FeedManagerSkeleton } from "@/components/feed/feed-manager-skeleton";
import { getCurrentSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Manage Feeds",
};

export default async function ManageFeedsPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <section
      className="flex flex-col gap-6"
      aria-labelledby="manage-feeds-title"
    >
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1
            id="manage-feeds-title"
            className="text-2xl font-semibold tracking-tight"
          >
            Manage Feeds
          </h1>
          <p className="text-muted-foreground text-sm">
            View and manage your subscribed content sources.
          </p>
        </div>
        <AddFeedDialog>
          <Plus size={40} className="text-primary" />
        </AddFeedDialog>
      </header>

      <Suspense fallback={<FeedManagerSkeleton />}>
        <FeedManager />
      </Suspense>
    </section>
  );
}
