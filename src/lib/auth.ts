import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous, testUtils } from "better-auth/plugins";
import { db } from "@/db";
import { PasswordResetEmail } from "@/emails/password-reset";
import { resend } from "./resend";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 6,
    sendResetPassword: async ({ user, url, token }, _request) => {
      // Don't await - prevents timing attacks
      void resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: [user.email],
        subject: "Reset your password",
        react: PasswordResetEmail({ resetUrl: url }),
      });
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins: [
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        // perform actions like moving the feed items from anonymous user to the new user
      },
    }),
    testUtils(),
  ],
});
