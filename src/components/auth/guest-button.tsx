"use client";

import { UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGuestSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.anonymous();
      if (error) {
        toast.error(error.message || "Failed to sign in as guest.");
      } else {
        toast.success("Signed in as guest!");
        router.push("/dashboard");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      type="button"
      className={cn(className)}
      disabled={disabled || isLoading}
      onClick={handleGuestSignIn}
      {...props}
    >
      {isLoading ? (
        <Spinner data-icon="inline-start" />
      ) : (
        showIcon && <UserIcon data-icon="inline-start" />
      )}
      {children || (isLoading ? "Signing in as guest..." : "Try as Guest")}
    </Button>
  );
}
