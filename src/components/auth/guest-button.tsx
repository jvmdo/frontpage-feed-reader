"use client";

import { UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

interface GuestButtonProps {
  disabled?: boolean;
}

export function GuestButton({ disabled }: GuestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.anonymous();
      if (error) {
        toast.error(error.message || "Failed to sign in as guest.");
      } else {
        toast.success("Signed in as guest!");
        router.push("/dashboard");
      }
    } catch (e) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      className="w-full"
      disabled={disabled || isLoading}
      onClick={handleGuestSignIn}
    >
      {isLoading ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <UserIcon data-icon="inline-start" />
      )}
      {isLoading ? "Signing in as guest..." : "Try as Guest"}
    </Button>
  );
}
