import { headers as nextHeaders } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth";

/**
 * For use in Server Components, Actions, and Route Handlers.
 * Leverages React 'cache' for per-request deduplication.
 */
export const getCurrentSession = cache(async () => {
  return await auth.api.getSession({
    headers: await nextHeaders(),
  });
});
