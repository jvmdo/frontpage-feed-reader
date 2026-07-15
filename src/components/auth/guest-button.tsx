"use client";

import { UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSignInAnonymous } from "@/hooks/user/use-sign-in-anonymous";
import { cn } from "@/lib/utils";

interface GuestButtonProps extends React.ComponentProps<typeof Button> {
  showIcon?: boolean;
}

export function GuestButton({
  className,
  children,
  disabled,
  showIcon = false,
  variant = "default",
  ...props
}: GuestButtonProps) {
  const { mutate: signInAnonymous, isPending } = useSignInAnonymous();

  const handleGuestSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isPending) return;

    e.preventDefault();

    signInAnonymous(undefined, {
      onSuccess: () => {
        toast.success("Signed in as guest!");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <Button
      variant={variant}
      type="button"
      className={cn(
        "relative overflow-hidden",
        isPending && "pointer-events-none select-none opacity-80",
        className,
      )}
      aria-label={isPending ? "Signing in as guest" : undefined}
      onClick={handleGuestSignIn}
      {...props}
    >
      {showIcon && <UserIcon data-icon="inline-start" />}
      {children || "Try as Guest"}
      {isPending && (
        <span
          role="status"
          aria-label="Loading"
          className="absolute bottom-0 left-0 h-0.75 w-full overflow-hidden bg-current/20"
        >
          <span className="absolute top-0 bottom-0 left-0 w-1/3 bg-current animate-loading-bar" />
        </span>
      )}
    </Button>
  );
}
