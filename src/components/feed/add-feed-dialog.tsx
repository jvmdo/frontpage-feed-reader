"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

interface AddFeedDialogProps {
  children: React.ReactNode;
}

export function AddFeedDialog({ children }: AddFeedDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Feed</DialogTitle>
          <DialogDescription>
            Enter the URL of the RSS or Atom feed you want to subscribe to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => e.preventDefault()} className="py-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="feed-url">Feed URL</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="feed-url"
                  placeholder="https://example.com/feed.xml"
                  type="url"
                  required
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton type="submit" variant="default">
                    Add
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
