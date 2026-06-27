import { UserStatsGridSkeleton } from "@/components/user/user-stats-grid";
import { ProfileDetailsSkeleton } from "./profile-client";

export default function ProfileLoading() {
  return (
    <section
      className="flex flex-col gap-6"
      role="status"
      aria-label="Loading profile"
    >
      <header className="flex flex-col gap-1">
        <h1
          id="profile-title"
          className="text-2xl font-semibold tracking-tight"
        >
          Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal details, credentials, and view account
          statistics.
        </p>
      </header>

      <div className="space-y-8">
        <UserStatsGridSkeleton />
        <ProfileDetailsSkeleton />
      </div>
    </section>
  );
}
