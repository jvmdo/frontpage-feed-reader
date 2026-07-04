import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a new Frontpage account and customize your feed aggregator.",
};

export default function SignupPage() {
  return <SignupForm />;
}
