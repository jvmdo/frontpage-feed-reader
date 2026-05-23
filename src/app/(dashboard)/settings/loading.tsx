import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <section
      className="flex flex-col gap-6"
      role="status"
      aria-label="Loading settings"
    >
      <header className="flex flex-col gap-1">
        <h1
          id="settings-title"
          className="text-2xl font-semibold tracking-tight"
        >
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your account preferences and application settings.
        </p>
      </header>

      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-64 w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </section>
  );
}
