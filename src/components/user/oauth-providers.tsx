"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GithubIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";
import { useOAuthToggle } from "@/hooks/user/use-oauth-toggle";
import { useUserAccounts } from "@/hooks/user/use-user-accounts";

export function OAuthProviders() {
  const { isLinked, isPending, toggle } = useOAuthToggle("github", {
    onUnlinkSuccess: () => {
      toast.success("GitHub account unlinked successfully.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { data: accounts } = useUserAccounts();
  const hasPassword = accounts.some((acc) => acc.providerId === "credential");

  return (
    <Card className="*:w-full *:mx-auto xl:*:min-w-xl xl:*:max-w-3xl xl:*:mx-56">
      <CardHeader>
        <CardTitle>
          <h2>Connected Accounts</h2>
        </CardTitle>
        <CardDescription>
          Manage your social accounts connections. Once linked, you can sign in
          with one click via the social account button.
          {hasPassword &&
            " In case your social email address is different from your profile email, you won't be able to use it in the email/password login form."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 border rounded-lg bg-bg-secondary">
          <div className="flex items-center gap-3">
            <GithubIcon className="size-5" />
            <div>
              <div className="font-medium text-sm">GitHub</div>
              <p className="text-xs text-muted-foreground">
                {isLinked ? "Connected to GitHub" : "Not connected"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isLinked ? "destructive" : "outline"}
              size="sm"
              disabled={isPending}
              onClick={toggle}
            >
              {isPending && <Spinner data-icon="inline-start" />}
              {isPending
                ? isLinked
                  ? "Disconnecting..."
                  : "Connecting..."
                : isLinked
                  ? "Disconnect"
                  : "Connect"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
