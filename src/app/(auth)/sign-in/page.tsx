import type { Metadata } from "next";
import { SigninForm } from "@/components/auth/signin-form";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your Frontpage account to access your feed aggregator.",
};

export default function SigninPage() {
  return <SigninForm />;
}
