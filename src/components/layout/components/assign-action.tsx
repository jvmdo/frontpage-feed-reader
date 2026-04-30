"use client";

import { PlusIcon } from "lucide-react";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AssignAction({
  categoryId,
  className,
}: {
  categoryId: number | null;
  className?: string;
}) {
  if (!categoryId) return null;

  return (
    <AssignFeedsDialog categoryId={categoryId}>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "h-8 px-3 text-muted-foreground hover:text-foreground",
          className,
        )}
      >
        <PlusIcon className="size-3.5 mr-2" />
        Assign
      </Button>
    </AssignFeedsDialog>
  );
}
