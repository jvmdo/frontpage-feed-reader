"use client";

import { useHotkeys } from "react-hotkeys-hook";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useKeyboardShortcutsStore } from "@/hooks/ui/use-keyboard-shortcuts-store";

const shortcutGroups = [
  {
    title: "Global",
    shortcuts: [
      { keys: ["?"], label: "Keyboard shortcuts guide" },
      { keys: ["⌘", "K"], label: "Search palette" },
      { keys: ["/"], label: "Search palette (alternate)" },
    ],
  },
  {
    title: "Feed List",
    shortcuts: [
      { keys: ["j", "↓"], label: "Next article" },
      { keys: ["k", "↑"], label: "Previous article" },
      { keys: ["Enter"], label: "Open article" },
      { keys: ["o"], label: "Open article (alternate)" },
      { keys: ["m"], label: "Mark as read / unread" },
      { keys: ["s", "b"], label: "Save / unsave article" },
      { keys: ["Esc"], label: "Clear list selection" },
    ],
  },
  {
    title: "Reader View",
    shortcuts: [
      { keys: ["j", "→"], label: "Next article" },
      { keys: ["k", "←"], label: "Previous article" },
      { keys: ["m"], label: "Mark as read / unread" },
      { keys: ["s", "b"], label: "Save / unsave article" },
      { keys: ["Esc"], label: "Close reader" },
      { keys: ["o"], label: "Close reader (alternate)" },
    ],
  },
];

export function KeyboardShortcutsDialog() {
  const { isOpen, setOpen } = useKeyboardShortcutsStore();

  useHotkeys(
    "shift+Slash",
    (e) => {
      e.preventDefault();
      setOpen(true);
    },
    { enableOnFormTags: false },
  );

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription className="sr-only">
            List of keyboard shortcuts for navigating the application.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-2 pb-4">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground border-b pb-1">
                {group.title}
              </h4>
              <div className="grid gap-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.label}
                    </span>
                    <KbdGroup>
                      {shortcut.keys.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                      ))}
                    </KbdGroup>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
