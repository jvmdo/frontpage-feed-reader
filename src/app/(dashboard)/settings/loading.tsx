import { SettingsFormSkeleton } from "@/components/user/settings-form";

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

      <SettingsFormSkeleton />
    </section>
  );
}
