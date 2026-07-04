"use client";

import { HotkeysProvider as ReactHotkeysProvider } from "react-hotkeys-hook";

export function HotkeysProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReactHotkeysProvider initiallyActiveScopes={["list", "global"]}>
      {children}
    </ReactHotkeysProvider>
  );
}
