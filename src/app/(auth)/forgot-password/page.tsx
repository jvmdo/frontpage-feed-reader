import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password | Frontpage",
  description: "Request a password reset link for your Frontpage account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
