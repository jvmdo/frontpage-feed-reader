import { BookCheckIcon, BookIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ItemWithSource } from "@/types";

interface ToggleReadButtonProps {
  data?: ItemWithSource;
  onClick: () => void;
  disabled: boolean;
}

export function ToggleReadButton({
  data,
  onClick,
  disabled,
}: ToggleReadButtonProps) {
  if (!data) return null;

  const tooltipContent = data.isWatermarked
    ? "This article was archived by a 'Mark all read' action."
    : data.isRead
      ? "Mark as unread (m)"
      : "Mark as read (m)";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          aria-label={data.isRead ? "Mark as unread" : "Mark as read"}
          disabled={disabled}
          className={cn(
            "ml-2",
            data.isWatermarked && "opacity-50 cursor-not-allowed",
          )}
        >
          {data.isRead ? (
            <BookCheckIcon className="size-4 md:size-5" />
          ) : (
            <BookIcon className="size-4 md:size-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltipContent}</TooltipContent>
    </Tooltip>
  );
}
