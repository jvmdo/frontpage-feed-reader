import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export interface CategoryDotProps
  extends Omit<ComponentPropsWithoutRef<"span">, "color"> {
  /** The color code of the category, or null/undefined if uncategorized */
  color?: string | null;
  /** Size variants for the category dot, mapping to tailwind sizes: sm (1.5), default (2), lg (3) */
  size?: "sm" | "default" | "lg";
  /** Whether to apply a border class to the category dot */
  hasBorder?: boolean;
}

/**
 * Renders a customizable category color indicator dot.
 */
export function CategoryDot({
  color,
  size = "default",
  hasBorder = false,
  className,
  "aria-hidden": ariaHidden = "true",
  ...props
}: CategoryDotProps) {
  const sizeClasses = {
    sm: "size-1.5",
    default: "size-2",
    lg: "size-3",
  };

  return (
    <span
      className={cn(
        "rounded-full shrink-0",
        sizeClasses[size],
        hasBorder && "border border-border",
        className,
      )}
      style={{ backgroundColor: color ?? "" }}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}
