import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [anonymousClient()],
});

export type Session = typeof authClient.$Infer.Session;
export type SessionUser = typeof authClient.$Infer.Session.user;
