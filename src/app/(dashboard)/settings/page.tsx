import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  SettingsForm,
  SettingsFormSkeleton,
} from "@/components/user/settings-form";
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

      <Suspense fallback={<SettingsFormSkeleton />}>
        <SettingsFormContainer userId={session.user.id} />
      </Suspense>
    </section>
  );
}

/**
 * Server component wrapper that queries user pref.
 */
async function SettingsFormContainer({ userId }: { userId: string }) {
  const preferences = await getUserPreferences(db, userId);
  return <SettingsForm initialData={preferences} />;
}
