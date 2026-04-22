# Subtask: Phase 6 - Step 1: Create the reader view layout

## Context

* **What can the user do?** The user can click on a feed item to open a focused "Reader View" panel (Sheet) that displays the full article content with clean, serif typography.

* **Why are we building this?** To provide a distraction-free reading experience that feels like a native part of the application, keeping users engaged without needing to leave for external tabs.

## Prerequisites

* **Auth:** Authenticated user.
* **Data:** `feed_items` table must contain content and description.
* **APIs / Services:** `getUserFeedItems` already exists; we need a single item variant.
* **UI:** Dashboard layout and `FeedItemCard` must exist.
* **Config:** `nuqs` configured for URL state management.

## Tech stack decisions

* `nuqs`: for type-safe URL state management of the `itemId` (active article).
* `shadcn/ui Sheet`: for the reader view overlay.
* `DOMPurify`: already in use for sanitization; we will trust the database content.

## Use cases

* ✅ Clicking an article title or card opens the Reader View sheet.
* ✅ The Reader View displays the article title, source, and full content.
* ✅ Typography uses the serif stack (Georgia) for the article body.
* ✅ Closing the sheet clears the `itemId` from the URL.

* ❌ Opening a non-existent item should display a clear error state in the sheet.
* ❌ Content should not overflow horizontally on mobile.

---

## Subtasks

### Subtask 1: Infrastructure/Data - Single Item Retrieval

**Deliverable:** A service function and API route to fetch a single feed item with its associated feed metadata.
**Touches:** `src/services/feed/get-feed-item.ts`, `src/app/api/feeds/items/[id]/route.ts`

**Todos:**

1. [x] Implement `getFeedItem(db, userId, itemId)` in `src/services/feed/get-feed-item.ts`.
2. [x] Create a new API route `src/app/api/feeds/items/[id]/route.ts` that validates the session and calls `getFeedItem`.
3. [x] Verify that the item belongs to a feed the user is actually subscribed to (ownership check).

**Done when:** `GET /api/feeds/items/[id]` returns the correct item JSON for a subscribed feed and 404/401 otherwise.

---

### Subtask 2: UI - Reactive Article State

**Deliverable:** A hook and updated card component that manages the "active article" via URL query parameters.
**Touches:** `src/hooks/use-active-item.ts`, `src/components/feed/feed-item-card.tsx`

**Todos:**

1. [x] Create `src/hooks/use-active-item.ts` using `nuqs` to manage the `itemId` query parameter (parsed as integer).
2. [x] Update `FeedItemCard` to use `useActiveItem`.
3. [x] Click now opens the Reader sheet.
4. [x] Ensure `markAsRead` is still triggered when opening the reader view.

**Done when:** Clicking a card updates the URL to `?itemId=123` and triggers the read state mutation.

---

### Subtask 3: UI - Reader View Layout & Content Rendering

**Deliverable:** A typographically polished reader view component that renders article HTML.
**Touches:** `src/components/reader/reader-view.tsx`, `src/app/globals.css` (if needed)

**Todos:**

1. [x] Create `src/components/reader/reader-view.tsx` accepting `data: FeedItemWithSource`.
2. [x] Implement `ReaderViewContent` component that uses `dangerouslySetInnerHTML` for `item.content` or `item.description`.
3. [x] Apply `font-serif` (Georgia) and `leading-loose` to the article body.
4. [x] Add specific styling for headings, blockquotes, and code blocks within the article body to match the Brand Kit.
5. [x] Ensure images are responsive and centered.

**Done when:** The article content is rendered with beautiful, serif typography and clean spacing.

---

### Subtask 4: UI - Integration (Sheet Overlay)

**Deliverable:** The reader view is hosted within a shadcn/ui Sheet that reacts to the URL state.
**Touches:** `src/components/feed/feed-reader-sheet.tsx`, `src/app/(dashboard)/dashboard/page.tsx`, `src/hooks/use-feed-item.ts`

**Todos:**

1. [x] Create `useFeedItem(id)` hook using TanStack Query to fetch from the new API route.
2. [x] Build `FeedReaderSheet` that uses `useActiveItem` to control its `open` state.
3. [x] Handle loading (skeletons) and error states within the sheet.
4. [x] Mount `FeedReaderSheet` in the dashboard page.

**Done when:** Clicking an article slides in the sheet from the right with the article content loaded.

---

### Subtask 5: Tests

**Deliverable:** All tests pass and the flow is verified end-to-end.
**Touches:** `src/services/feed/get-feed-item.test.ts`, `src/components/reader/reader-view.test.tsx`, `e2e/reader-view.spec.ts`

**Todos:**

1. [x] **API Unit (Vitest):** `/api/feeds/items/[id]/route.ts`
2. [x] **Service Integration (Vitest + PGLite):** `get-feed-item.test.ts`
    * Verify `getFeedItem` returns the correct item and "isRead" state when the user is subscribed.
    * Verify `getFeedItem` returns `null` (unauthorized/not found) if the item exists but the user is NOT subscribed to the parent feed.
3. [x] **UI Integration (RTL + MSW):** `reader-view.test.tsx`
    * Verify `ReaderView` renders the title, feed name, and relative date.
    * Verify `ReaderViewContent` correctly renders sanitized HTML (links, blockquotes).
    * Verify `FeedReaderSheet` displays the `ReaderSkeleton` when `isLoading` is true.
    * Verify `FeedReaderSheet` displays the `Alert` error message when the API returns a 404 or 500.
4. [x] **E2E (Playwright):** `reader-view.spec.ts`
    * **Full Flow:** User clicks a feed item card -> URL updates with `itemId` -> Sheet slides in -> Content is visible.
    * **Persistence:** Refreshing the page with `?itemId=X` in the URL opens the reader sheet automatically.
    * **State Sync:** Clicking an unread article in the list marks it as read visually in the background while the reader opens.
    * **Dismissal:** Clicking the sheet overlay or close button clears the `itemId` from the URL and closes the panel.

**Done when:** all tests pass and every test would fail if the logic it targets were deleted

---

## Final checklist

* [x] Happy path works end-to-end (Click -> Open Sheet -> Read)
* [x] Errors (404, 500) are handled gracefully in the UI
* [x] Typography matches the Brand Kit (Georgia for body)
* [x] No existing functionality (infinite scroll, filters) is broken
* [x] Each subtask produces a standalone commit
* [x] `bun tsc --noEmit` passes after each subtask before moving to the next
