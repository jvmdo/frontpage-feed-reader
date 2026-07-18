"use client";

import Link from "next/link";
import GithubButton from "@/components/auth/github-button";
import { GuestButton } from "@/components/auth/guest-button";
import { Button } from "@/components/ui/button";

export function OneClickAuth({
  githubText = "Sign in with GitHub",
  showDevLogin = false,
}: {
  githubText?: string;
  showDevLogin?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <GithubButton disabled={false}>{githubText}</GithubButton>
      <GuestButton variant="outline" showIcon={true} disabled={false} />
      {showDevLogin && process.env.NODE_ENV === "development" && (
        <Button asChild={true} variant="outline" className="w-full">
          <Link href="/api/dev-login">Auto Login (Dev Only)</Link>
        </Button>
      )}
    </div>
  );
}
