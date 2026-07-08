import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({
  className,
  "aria-hidden": ariaHidden,
  ...props
}: React.ComponentProps<"svg">) {
  const isVisible = ariaHidden === false || ariaHidden === "false";

  return (
    <Loader2Icon
      role={isVisible ? "status" : undefined}
      aria-label={isVisible ? "Loading" : undefined}
      aria-hidden={!isVisible ? "true" : undefined}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}
