import { useMutation } from "@tanstack/react-query";
import { useRouter } from "nextjs-toploader/app";
import { useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import type { SignInInput } from "@/lib/validations/auth";

export function useSignIn() {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();

  const mutation = useMutation({
    mutationFn: async (data: SignInInput) => {
      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: "/dashboard",
      });

      if (error) {
        throw new Error(error.message || "Invalid email or password.");
      }
    },
    onSuccess: () => {
      startTransition(() => {
        router.push("/dashboard");
      });
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending || isNavigating,
  };
}
