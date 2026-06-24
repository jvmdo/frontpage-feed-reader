import { type Tour, waitForElement, waitForEvent } from "@ark-ui/react/tour";
import { toast } from "sonner";
import { useTourStore } from "@/hooks/ui/use-tour-store";
import { WELCOME_FEED_URL } from "@/lib/constants";

/**
 * Helper to find the first visible element matching a selector.
 * Useful when multiple elements share a data-tour attribute (e.g. mobile vs desktop variants).
 */
const getVisibleTarget = (selector: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(selector)).find(
    (el) => el.offsetWidth > 0 && el.offsetHeight > 0,
  ) ?? null;

const endTourWithError = (
  update: (details: Partial<Tour.StepDetails>) => void,
  show: () => void,
  message: string,
) => {
  toast.error(message);
  update({
    type: "dialog",
    title: "Tour paused",
    description: `${message} You can try again later from the user menu.`,
    actions: [{ label: "Close", action: "dismiss" }],
  });
  show();
  useTourStore.getState().setTourCompleted(true);
};

/**
 * Guard to ensure we only call next() if the tour is still active.
 * Prevents late-resolving promises from re-opening a failed tour.
 */
const safeNext = (next: () => void) => {
  if (useTourStore.getState().isTourActive) {
    next();
  }
};

export const steps: Tour.StepDetails[] = [
  // --- PHASE 1: Add Feed ---
  {
    id: "add-feed-button",
    type: "tooltip",
    placement: "right",
    title: "Add your first feed",
    description: "Click here to add a new RSS or Atom feed to your dashboard.",
    target: () => getVisibleTarget('[data-tour="add-feed"]'),
    effect({ next, target, show, update }) {
      show();
      let cancelWait: (() => void) | undefined;
      const [promise, cancel] = waitForEvent(target, "click");

      promise.then(() => {
        const [waitPromise, cancelWaitFn] = waitForElement(
          () => document.querySelector('[data-tour="add-feed-url"]'),
          { timeout: 5000 },
        );
        cancelWait = cancelWaitFn;
        waitPromise
          .then(() => safeNext(next))
          .catch(() =>
            endTourWithError(update, show, "Form took too long to open."),
          );
      });

      return () => {
        cancel();
        cancelWait?.();
      };
    },
  },
  {
    id: "add-feed-form-url",
    type: "tooltip",
    title: "Feed URL input",
    description: "We've prefilled a welcome feed for you. Hit next.",
    target: () => document.querySelector('[data-tour="add-feed-url"]'),
    actions: [{ label: "Next", action: "next" }],
    effect({ show }) {
      // Prefill the URL via store
      useTourStore.getState().setPrefillUrl(WELCOME_FEED_URL);
      show();
    },
  },
  {
    id: "add-feed-form-verify",
    type: "tooltip",
    title: "Verify feed",
    description:
      "Click 'Verify Feed' to check if entered URL points to a valid feed.",
    target: () => document.querySelector('[data-tour="add-feed-verify"]'),
    effect({ next, target, show, update }) {
      show();
      let cancelWait: (() => void) | undefined;
      const [promise, cancel] = waitForEvent(target, "click");

      promise.then(() => {
        const [waitPromise, cancelWaitFn] = waitForElement(
          () => document.querySelector('[data-tour="add-feed-submit"]'),
          { timeout: 10000 },
        );
        cancelWait = cancelWaitFn;
        waitPromise
          .then(() => safeNext(next))
          .catch(() =>
            endTourWithError(update, show, "Verification took too long."),
          );
      });

      return () => {
        cancel();
        cancelWait?.();
      };
    },
  },
  {
    id: "add-feed-preview",
    type: "tooltip",
    title: "Feed preview",
    description:
      "Verify that the title, description, and status of the feed are correct.",
    target: () => document.querySelector('[data-tour="feed-preview-card"]'),
    actions: [{ label: "Next", action: "next" }],
    effect({ show }) {
      show();
    },
  },
  {
    id: "add-feed-form-submit",
    type: "tooltip",
    title: "Subscribe to a feed",
    description: "Just click 'Add Feed' to continue.",
    target: () => document.querySelector('[data-tour="add-feed-submit"]'),
    effect({ next, target, show, update }) {
      show();
      let cancelWait: (() => void) | undefined;
      const [promise, cancel] = waitForEvent(target, "click");

      promise.then(() => {
        useTourStore.getState().setPrefillUrl(null);

        // 1. First wait for the dialog to disappear (submit successful)
        const checkDialogClosed = () => {
          return new Promise<void>((resolve) => {
            const check = () => {
              if (!document.querySelector('[data-tour="add-feed-dialog"]')) {
                resolve();
              } else {
                requestAnimationFrame(check);
              }
            };
            check();
          });
        };

        const dialogWaitPromise = checkDialogClosed();

        // 2. Only after dialog is gone, open sidebar and wait for feed
        dialogWaitPromise.then(() => {
          if (!useTourStore.getState().isTourActive) return;

          useTourStore.getState().setIsWaitingForFeed(true);

          const [waitPromise, cancelWaitFn] = waitForElement(
            () => document.querySelector('[data-tour="welcome-feed"]'),
            { timeout: 15000 },
          );
          cancelWait = cancelWaitFn;

          waitPromise
            .then(() => {
              useTourStore.getState().setIsWaitingForFeed(false);
              safeNext(next);
            })
            .catch(() => {
              useTourStore.getState().setIsWaitingForFeed(false);
              endTourWithError(update, show, "Feed took too long to appear.");
            });
        });
      });

      return () => {
        cancel();
        cancelWait?.();
        useTourStore.getState().setIsWaitingForFeed(false);
      };
    },
  },

  // --- PHASE 2: Feed Selection ---
  {
    id: "click-welcome-feed",
    type: "tooltip",
    title: "View your feeds",
    placement: "right",
    description: "Click on the welcome feed to see its latest articles.",
    target: () => document.querySelector('[data-tour="welcome-feed"]'),
    effect({ next, target, show, update }) {
      show();
      let cancelWait: (() => void) | undefined;
      const [promise, cancel] = waitForEvent(target, "click");

      promise.then(() => {
        const [waitPromise, cancelWaitFn] = waitForElement(
          () => document.querySelector('[data-tour="welcome-item"]'),
          { timeout: 15000 },
        );
        update({
          title: "Loading feed items...",
          description: "Please, wait while items are fetched.",
        });
        show();
        cancelWait = cancelWaitFn;
        waitPromise
          .then(() => safeNext(next))
          .catch(() =>
            endTourWithError(update, show, "Articles took too long to load."),
          );
      });

      return () => {
        cancel();
        cancelWait?.();
      };
    },
  },

  // --- PHASE 3: Reading ---
  {
    id: "click-welcome-item",
    type: "tooltip",
    title: "Read an article",
    description: "Click on an article card to open the reader view.",
    target: () => document.querySelector('[data-tour="welcome-item"]'),
    effect({ next, target, show, update }) {
      show();
      let cancelWait: (() => void) | undefined;
      const [promise, cancel] = waitForEvent(target, "click");

      promise.then(() => {
        const [waitPromise, cancelWaitFn] = waitForElement(
          () => document.querySelector('[data-tour="reader-content"]'),
          { timeout: 5000 },
        );
        cancelWait = cancelWaitFn;
        waitPromise
          .then(() => safeNext(next))
          .catch(() =>
            endTourWithError(update, show, "Reader content failed to load."),
          );
      });

      return () => {
        cancel();
        cancelWait?.();
      };
    },
  },
  {
    id: "reader-content",
    type: "floating",
    title: "Immersive Reading",
    placement: "bottom-end",
    description:
      "Enjoy a clean reading experience. You can scroll through the entire content here.",
    actions: [{ label: "Next", action: "next" }],
    effect({ show }) {
      show();
    },
  },

  // --- PHASE 4: Completion ---
  {
    id: "complete",
    type: "dialog",
    title: "You're all set!",
    description:
      "You've learned the basics. Enjoy exploring your favorite feeds with Frontpage!",
    actions: [{ label: "Finish", action: "dismiss" }],
    effect({ show }) {
      show();
      // Auto-close reader when showing the completion dialog
      setTimeout(() => {
        const closeButton = document.querySelector<HTMLButtonElement>(
          '[data-tour="reader-close"]',
        );
        closeButton?.click();
      }, 100);
    },
  },
];
