"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ServerTimeContext = createContext<{ adjustedNow: Date | null }>({
  adjustedNow: null,
});

/**
 * Provides a clock offset between the server and the client.
 * Helps fixing "time travel" issues where client and server clocks are out of sync.
 */
export function ServerTimeProvider({
  children,
  serverNow,
}: {
  children: React.ReactNode;
  serverNow: string;
}) {
  const [adjustedNow, setAdjustedNow] = useState<Date | null>(null);

  useEffect(() => {
    const serverTime = new Date(serverNow).getTime();
    const clientTime = Date.now();
    const offset = serverTime - clientTime;

    // Set the initial adjusted time
    setAdjustedNow(new Date(Date.now() + offset));

    // ONE global timer for the entire application
    const interval = setInterval(() => {
      setAdjustedNow(new Date(Date.now() + offset));
    }, 30000);

    return () => clearInterval(interval);
  }, [serverNow]);

  return (
    <ServerTimeContext.Provider value={{ adjustedNow }}>
      {children}
    </ServerTimeContext.Provider>
  );
}

export function useServerTime() {
  return useContext(ServerTimeContext);
}
