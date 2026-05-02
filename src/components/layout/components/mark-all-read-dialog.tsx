"use client";

import type * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMarkAllReadUI } from "@/hooks/ui/use-mark-all-read-ui";

interface MarkAllReadActionProps {
  children: React.ReactNode;
}

export function MarkAllReadDialog({ children }: MarkAllReadActionProps) {
  const { scopeLabel, handleMarkAllRead } = useMarkAllReadUI();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark everything as read?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark all items in {scopeLabel} as read. This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleMarkAllRead}>
            Mark all as read
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
