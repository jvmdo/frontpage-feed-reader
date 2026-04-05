import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";

export default async function ManageFeedsPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Manage Feeds</h1>
        <p className="text-muted-foreground text-sm">
          View and manage your subscribed content sources.
        </p>
      </div>

      <div className="flex-1 rounded-xl border border-border/50 bg-card p-4 shadow-sm md:p-6">
        {/* 
          TODO: Subtask 4: Integration
          This area will contain the FeedTable component showing real data.
        */}
        <div className="flex h-100 items-center justify-center text-muted-foreground italic text-sm">
          Feed management table will be implemented here.
        </div>
      </div>
    </div>
  );
}
