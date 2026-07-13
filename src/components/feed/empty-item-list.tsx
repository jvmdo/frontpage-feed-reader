"use client";

import type React from "react";
import { AssignFeedsDialog } from "@/components/category/assign-feeds-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useEmptyItemListConfig } from "@/hooks/feed/use-empty-item-list-config";

export function EmptyItemList() {
  const { config, categoryId, onShowRead, onShowUnread } =
    useEmptyItemListConfig();

  // Resolve actions declaratively based on config actionType
  let action: React.ReactNode;
  if (config.actionType === "show-read") {
    action = <ShowReadAction onShowRead={onShowRead} />;
  } else if (config.actionType === "show-unread") {
    action = <ShowUnreadAction onShowUnread={onShowUnread} />;
  } else if (config.actionType === "assign-feeds" && categoryId) {
    action = <AssignFeedsAction categoryId={categoryId} />;
  }

  return (
    <EmptyState
      title={<h3>{config.title}</h3>}
      description={config.description}
      icon={config.icon}
      action={action}
    />
  );
}

const ShowReadAction = ({ onShowRead }: { onShowRead: () => void }) => (
  <Button variant="outline" onClick={onShowRead}>
    Show read articles
  </Button>
);

const ShowUnreadAction = ({ onShowUnread }: { onShowUnread: () => void }) => (
  <Button variant="outline" onClick={onShowUnread}>
    Show unread articles
  </Button>
);

const AssignFeedsAction = ({ categoryId }: { categoryId: number }) => (
  <div className="flex flex-col items-center gap-4">
    <p className="text-muted-foreground text-sm">
      Assign feeds to this category to see them here.
    </p>
    <AssignFeedsDialog categoryId={categoryId}>
      <Button variant="outline">Assign feeds</Button>
    </AssignFeedsDialog>
  </div>
);
