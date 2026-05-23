import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/user/settings-form";
import { db } from "@/db";
import { getCurrentSession } from "@/lib/session";
import { getUserPreferences } from "@/services/user/get-user-preferences";

/**
 * Settings page where users can manage their preferences.
 */
export default async function SettingsPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const preferences = await getUserPreferences(db, session.user.id);

  return (
    <section className="flex flex-col gap-6" aria-labelledby="settings-title">
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

      <SettingsForm initialData={preferences} />
    </section>
  );
}
