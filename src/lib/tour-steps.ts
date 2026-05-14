import { type Tour, waitForElement, waitForEvent } from "@ark-ui/react/tour";
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

export const steps: Tour.StepDetails[] = [
  // --- PHASE 1: Add Feed ---
  {
    id: "add-feed-button",
    type: "tooltip",
    placement: "right",
    title: "Add your first feed",
    description: "Click here to add a new RSS or Atom feed to your dashboard.",
    target: () => getVisibleTarget('[data-tour="add-feed"]'),
    effect({ next, target, show }) {
      show();
      const [promise, cancel] = waitForEvent(target, "click");
      promise.then(() => next());
      return cancel;
    },
  },
  {
    id: "wait-for-add-form",
    type: "wait",
    effect({ next }) {
      const [promise, cancel] = waitForElement(
        () => document.querySelector('[data-tour="add-feed-url"]'),
        { timeout: 5000 },
      );
      promise.then(() => next());
      return cancel;
    },
    title: undefined,
    description: undefined,
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
    id: "add-feed-form-submit",
    type: "tooltip",
    title: "Subscribe to a feed",
    description: "Just click 'Add Feed' to continue.",
    target: () => document.querySelector('[data-tour="add-feed-submit"]'),
    effect({ next, target, show }) {
      show();
      const [promise, cancel] = waitForEvent(target, "click");
      promise.then(() => {
        useTourStore.getState().setPrefillUrl(null);
        next();
      });
      return cancel;
    },
  },

  // --- PHASE 2: Feed Selection ---
  {
    id: "wait-for-sidebar-feed",
    type: "wait",
    effect({ next }) {
      const [promise, cancel] = waitForElement(
        () => document.querySelector('[data-tour="welcome-feed"]'),
        { timeout: 10000 },
      );
      promise.then(() => next());
      return cancel;
    },
    title: undefined,
    description: undefined,
  },
  {
    id: "click-welcome-feed",
    type: "tooltip",
    title: "View your feeds",
    placement: "right",
    description: "Click on the welcome feed to see its latest articles.",
    target: () => document.querySelector('[data-tour="welcome-feed"]'),
    effect({ next, target, show }) {
      show();
      const [promise, cancel] = waitForEvent(target, "click");
      promise.then(() => next());
      return cancel;
    },
  },

  // --- PHASE 3: Reading ---
  {
    id: "wait-for-welcome-item",
    type: "wait",
    effect({ next }) {
      const [promise, cancel] = waitForElement(
        () => document.querySelector('[data-tour="welcome-item"]'),
        { timeout: 10000 },
      );
      promise.then(() => next());
      return cancel;
    },
    title: undefined,
    description: undefined,
  },
  {
    id: "click-welcome-item",
    type: "tooltip",
    title: "Read an article",
    description: "Click on an article card to open the reader view.",
    target: () => document.querySelector('[data-tour="welcome-item"]'),
    effect({ next, target, show }) {
      show();

      const [promise, cancel] = waitForEvent(target, "click");
      promise.then(() => next());
      return cancel;
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
      const [promise, cancel] = waitForElement(
        () => document.querySelector('[data-tour="reader-content"]'),
        { timeout: 5000 },
      );
      promise.then(() => show());
      return cancel;
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
