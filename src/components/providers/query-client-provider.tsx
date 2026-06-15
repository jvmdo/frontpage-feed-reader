"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { getQueryClient } from "@/lib/get-query-client";

export function ReactQueryClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user?.id;
  const lastUserIdRef = useRef<string | undefined>(undefined);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (isPending) return;

    if (!hasLoadedRef.current) {
      lastUserIdRef.current = userId;
      hasLoadedRef.current = true;
      return;
    }

    if (lastUserIdRef.current !== userId) {
      queryClient.clear();
      lastUserIdRef.current = userId;
    }
  }, [userId, isPending, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
