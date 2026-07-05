import { FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { WithFeedFilters } from "./with-feed-filters";

export function FilterDropdown() {
  return (
    <WithFeedFilters>
      {({ isFilterActive, DesktopContent }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={isFilterActive ? "secondary" : "outline"}
              className={cn(
                "lg:h-8",
                isFilterActive &&
                  "text-primary border-primary/20 bg-primary/10 hover:bg-primary/15",
              )}
            >
              <FilterTriggerContent isFilterActive={isFilterActive} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {DesktopContent}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </WithFeedFilters>
  );
}

export function FilterTriggerContent({
  isFilterActive,
}: {
  isFilterActive: boolean;
}) {
  return (
    <>
      <div className="relative">
        <FilterIcon className="size-4 lg:size-3.5" data-icon="inline-start" />
        {isFilterActive && (
          <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-primary" />
        )}
        {isFilterActive && <span className="sr-only">(active)</span>}
      </div>
      <span className="lg:text-xs">Filter</span>
    </>
  );
}
