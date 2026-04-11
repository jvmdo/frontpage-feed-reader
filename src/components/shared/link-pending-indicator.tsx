import { useLinkStatus } from "next/link";

export function LinkPendingIndicator() {
  const { pending } = useLinkStatus();

  if (!pending) return null;

  return (
    <span
      aria-hidden
      className="absolute right-2 size-1.5 animate-pulse rounded-full bg-accent"
    />
  );
}
