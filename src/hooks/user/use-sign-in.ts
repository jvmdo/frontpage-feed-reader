import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { SignInInput } from "@/lib/validations/auth";

export function useSignIn() {
  const router = useRouter();

  return useMutation({
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
      router.push("/dashboard");
    },
  });
}
