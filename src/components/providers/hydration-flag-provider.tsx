"use client";

import React from "react";

function HydrationFlagProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    document.body.setAttribute("data-hydrated", "true");
  }, []);

  return children;
}

export default HydrationFlagProvider;
