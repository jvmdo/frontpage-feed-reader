import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/ui/icons";
import { authClient } from "@/lib/auth-client";

function GithubButton({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled: boolean;
}) {
  return (
    <Button
      variant="outline"
      type="button"
      disabled={disabled}
      onClick={async () => {
        await authClient.signIn.social({
          provider: "github",
          callbackURL: "/dashboard",
        });
      }}
    >
      <GithubIcon className="size-4 mr-2" />
      {children}
    </Button>
  );
}

export default GithubButton;
