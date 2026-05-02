"use client";

import { PlusIcon } from "lucide-react";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import { Button } from "@/components/ui/button";

export function AssignAction({ categoryId }: { categoryId?: number | null }) {
  if (!categoryId) return null;

  return (
    <AssignFeedsDialog categoryId={categoryId}>
      <Button variant="outline" size="sm">
        <PlusIcon className="size-3.5" data-icon="inline-start" />
        Assign
      </Button>
    </AssignFeedsDialog>
  );
}
