# Subtask: Phase 6 - Step 2: Implement navigation controls (Next/Previous)

## Context

* **What can the user do?** The user can navigate to the next or previous article directly from the Reader View using on-screen buttons or keyboard shortcuts (arrows), without closing the current view.

* **Why are we building this?** To improve the flow of content consumption, allowing users to move through their feed efficiently once they've entered the deep-reading mode.

## Prerequisites

* **Auth:** Authenticated user.
* **Data:** `feed_items` must be accessible.
* **APIs / Services:** `useFeedItems` (infinite query) and `useActiveItem` (URL state) must exist.
* **UI:** `FeedReaderSheet` and `ReaderView` from Step 1 must be functional.

## Tech stack decisions

* `TanStack Query`: Use `allPages` and `flat()` to find neighbors in the current list of items.
* Keyboard Shortcuts: Implement arrow keys to align with power-user expectations.

## Use cases

* ✅ Clicking "Next" loads the subsequent article from the dashboard list.
* ✅ Clicking "Previous" loads the preceding article from the dashboard list.
* ✅ Navigation buttons are disabled when at the start or end of the current list.
* ✅ Pressing `arrow right/down` navigates to the next item.
* ✅ Pressing `arrow left/up` navigates to the previous item.
* ✅ Navigating to an item marks it as read.
* ✅ Keyboard focus should return to the card of the last loaded article after closing the sheet.

* ❌ Navigation should not break if the user reaches the end of the *currently loaded* items (consider if we should trigger "fetchNextPage").

---

## Subtasks

### Subtask 1: Business Logic - Feed Navigation Hook

**Deliverable:** A hook that identifies the next and previous item IDs based on the current list of items in the dashboard.
**Touches:** `src/hooks/use-feed-navigation.ts`

**Todos:**

1. [x] Implement `useFeedNavigation` hook.
2. [x] Retrieve the flattened list of items from the `useFeedItems` query cache.
3. [x] Find the index of the current `activeItemId`.
4. [x] Return `nextItemId`, `prevItemId`, and a `navigate(id)` function.
5. [x] Ensure navigation triggers `markAsRead` if the item is unread.

**Done when:** The hook correctly identifies neighbor IDs for any given active item within the loaded set.

---

### Subtask 2: UI - Reader Navigation Component

**Deliverable:** A navigation bar for the Reader View containing Next and Previous buttons.
**Touches:** `src/components/reader/reader-navigation.tsx`

**Todos:**

1. [x] Create `ReaderNavigation` component using shadcn/ui buttons and Lucide icons (ChevronLeft/Right).
2. [x] Connect buttons to the `navigate` function from `useFeedNavigation`.
3. [x] Disable buttons if no neighbor exists.
4. [x] Implement a sticky footer or header in the `SheetFooter` to keep controls accessible.

**Done when:** The navigation buttons are visible and functional within the reader sheet.

---

### Subtask 3: UI - Keyboard Shortcuts

**Deliverable:** Support for arrow keys to navigate between articles while the Reader is open.
**Touches:** `src/hooks/use-reader-shortcuts.ts`, `src/components/reader/feed-reader-sheet.tsx`

**Todos:**

1. [x] Create `useReaderShortcuts` hook to listen for `keydown` events.
2. [x] Map arrow keys to `navigate(nextItemId)` and `navigate(prevItemId)`.
3. [x] Ensure shortcuts only trigger when the Reader View is open and not focusing an input.
4. [x] Integrate the hook into `FeedReaderSheet`.

**Done when:** Pressing arrow keys successfully changes the active article.

---

### Subtask 4: UI - Integration & Polish

**Deliverable:** Seamless integration of navigation into the `FeedReaderSheet` with loading state handling.
**Touches:** `src/components/reader/feed-reader-sheet.tsx`

**Todos:**

1. [x] Add `ReaderNavigation` to `FeedReaderSheet`.
2. [x] Ensure the scroll position resets to the top when navigating to a new article.
3. [x] Verify that navigating to a "Next" item that hasn't been fetched yet works (or handles the edge case gracefully).

**Done when:** Navigating between articles feels smooth and resets the reader state correctly.

---

### Subtask 5: Tests

**Deliverable:** Navigation logic and interactions are verified.
**Touches:** `src/hooks/use-feed-navigation.test.ts`, `e2e/reader-navigation.spec.ts`

**Todos:**

1. [x] Unit: Test `useFeedNavigation` with mocked query data.
2. [x] E2E: Verify arrows and button clicks in the browser and unread state updates correctly after navigation.

**Done when:** All tests pass and the navigation flow is verified.

---

## Final checklist

* [x] Happy path works end-to-end (Next/Prev buttons and J/K keys)
* [x] Buttons are correctly disabled at boundaries
* [x] Read state is updated on navigation
* [x] Scroll position resets on article change
* [x] Each subtask produces a standalone commit
* [x] `bun tsc --noEmit` passes after each subtask
