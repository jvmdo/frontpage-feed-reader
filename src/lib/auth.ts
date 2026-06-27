import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { anonymous, testUtils } from "better-auth/plugins";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { PasswordResetEmail } from "@/emails/password-reset";
import { env, settings } from "@/env";
import { generateAnonName } from "@/lib/utils";
import { convertGuestToMember } from "@/services/auth/convert-guest-account";
import { onboardGuest } from "@/services/auth/onboard-guest";
import { resend } from "./resend";

export const auth = betterAuth({
  baseURL: {
    allowedHosts: ["localhost:*", "*.vercel.app"],
    fallback: settings.baseUrl,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  account: {
    accountLinking: {
      allowDifferentEmails: true,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Initialize universal preferences for EVERY new user
          await db
            .insert(userPreferences)
            .values({
              userId: user.id,
              refreshInterval: env.NEXT_PUBLIC_DEFAULT_REFRESH_INTERVAL,
            })
            .onConflictDoNothing();
        },
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/anonymous") {
        const returned = ctx.context.returned as any;
        const user = returned?.user || returned;

        if (user?.id && user.isAnonymous) {
          await onboardGuest(db, user.id);
        }
      }
    }),
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 6,
    sendResetPassword: async ({ user, url, token }, _request) => {
      // Don't await - prevents timing attacks
      void resend.emails.send({
        from: env.EMAIL_FROM,
        to: [user.email],
        subject: "Reset your password",
        react: PasswordResetEmail({ resetUrl: url }),
      });
    },
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID as string,
      clientSecret: env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins: [
    anonymous({
      disableDeleteAnonymousUser: true,
      generateName: generateAnonName,
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        await convertGuestToMember(db, anonymousUser.user.id, {
          ...newUser.user,
          name: anonymousUser.user.name,
        });
      },
    }),
    testUtils(),
  ],
  advanced: {
    // Disable secure cookies during E2E tests so they work over localhost
    useSecureCookies:
      process.env.NODE_ENV === "production" && !process.env.PLAYWRIGHT_TEST,
  },
});
