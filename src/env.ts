import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  isServer:
    typeof window === "undefined" ||
    !!process.env.VITEST ||
    !!process.env.PLAYWRIGHT_TEST ||
    !!process.env.CI,

  /**
   * Server-side Environment Variables
   */
  server: {
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.email().optional().default("onboarding@resend.dev"),
    REFRESH_CRON_SCHEDULE: z.string().optional().default("*/15 * * * *"),
    FEED_THROTTLE_MS: z.coerce.number().optional().default(60000),
    // Provided by Vercel
    VERCEL_URL: z.string().optional(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
    TRIGGER_SECRET_KEY: z.string().optional(),
  },

  /**
   * Client-side Environment Variables
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.url().optional(),
    NEXT_PUBLIC_VERCEL_URL: z.string().optional(),
    NEXT_PUBLIC_DEFAULT_REFRESH_INTERVAL: z.coerce.number().default(900),
    NEXT_PUBLIC_TRIGGER_THROTTLE_MS: z.coerce
      .number()
      .optional()
      .default(60000),
  },

  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
    NEXT_PUBLIC_DEFAULT_REFRESH_INTERVAL:
      process.env.NEXT_PUBLIC_DEFAULT_REFRESH_INTERVAL,
    NEXT_PUBLIC_TRIGGER_THROTTLE_MS:
      process.env.NEXT_PUBLIC_TRIGGER_THROTTLE_MS,
  },

  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});

/**
 * Computed Environment Values
 */
export const settings = {
  get baseUrl() {
    // 1. Manual override
    if (env.NEXT_PUBLIC_APP_URL) return env.NEXT_PUBLIC_APP_URL;

    // 2. Vercel dynamic URL (Deployment specific)
    const vUrl = env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
    if (vUrl) return `https://${vUrl}`;

    // 3. Localhost
    return "http://localhost:3000";
  },

  // Trust Next.js hardcoded replacement for these
  isProd: process.env.NODE_ENV === "production",
  isDev: process.env.NODE_ENV === "development",
  isTest: process.env.NODE_ENV === "test",
};
