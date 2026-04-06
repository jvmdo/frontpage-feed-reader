"use client";

import { useQuery } from "@tanstack/react-query";
import type { FeedWithSubscription } from "@/types";
import { FeedTable } from "./feed-table";

interface FeedManagerProps {
  initialData: FeedWithSubscription[];
}

export function FeedManager({ initialData }: FeedManagerProps) {
  // We use useQuery purely for state management of the subscriptions list.
  // All updates are handled manually via setQueryData in mutation hooks.
  const { data } = useQuery({
    queryKey: ["subscriptions"],
    initialData,
    enabled: false,
    staleTime: Infinity,
  });

  return <FeedTable data={data} />;
}
