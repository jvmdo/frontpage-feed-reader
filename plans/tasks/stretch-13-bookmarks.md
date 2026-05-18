# Subtask: Bookmarks / Save for Later (Requirement 13)

## Context

* **What can the user do?** Save articles to a persistent reading list and access them via a "Saved" filter on the dashboard. This view allows for further refinement by category, feed, and read status. Both Guests and Members can use this feature.

* **Why are we building this?** To allow users to triage their feeds and keep important content for later consumption within the unified dashboard view.

## Prerequisites

* **Auth:** Authenticated session (Guest or Member).
* **Data:** `user_item_states` table already exists with `bookmarked_at` column.
* **APIs / Services:** `getItems` and `getUnreadCounts` services exist and support bookmarks.
* **UI:** `ItemCard` exists with a functional bookmark button. `AppSidebar` exists with an unread badge.
* **Config:** None.

## Tech stack decisions

* **State Management**: `nuqs` for managing the `saved`, `unreadOnly`, and multi-select source filters in the URL.
* **UI Components**:
  * `DropdownMenu` with `DropdownMenuCheckboxItem` for filter selection.
  * Horizontal scrollable area for active filter chips to ensure responsiveness.
* **Macro/Micro Selection**: Complex filtering logic that automatically collapses individual feed selections into a single "Category" chip when all feeds in that category are selected.

## Use cases

* ✅ Bookmark an item from any feed list.
* ✅ Remove a bookmark.
* ✅ Toggle the "Saved" view from the sidebar (clears source filters).
* ✅ Persist bookmark state across the session (Guest) or permanently (Member).
* ✅ Show the count of **unread** saved items in the sidebar.
* ✅ Narrow down saved items by Category or Feed using a multi-select dropdown.
* ✅ Toggle "Unread Only" filter within the Saved view.
* ✅ Active filters displayed as removable chips in a scrollable area below the toolbar.
* ✅ Automatic compaction: If all feeds in a category are selected, show 1 Category chip instead of N Feed chips.

---

## Subtasks

### Subtask 1: Data Layer & Type Updates

**Deliverable:** Types and core fetchers updated to support bookmark state and filtering.
**Touches:** `src/types/index.ts`, `src/services/item/get-items.ts`

**Todos:**

1. [x] Update `ItemWithSource` and `ListItemWithSource` in `src/types/index.ts` to include `isBookmarked: boolean` and `bookmarkedAt: Date | null`.
2. [x] Update `getItems` service in `src/services/item/get-items.ts` to select `userItemStates.bookmarkedAt`.
3. [x] Add `bookmarkedOnly?: boolean` to `GetItemsOptions` in `src/services/item/get-items.ts`.
4. [x] Implement filtering logic for `bookmarkedOnly` in `getItems`.
5. [x] Update `getItems` return mapper to populate `isBookmarked` and `bookmarkedAt`.

**Done when:** `getItems` can return bookmark state and filter items by bookmark status.

---

### Subtask 2: Business Logic - Services & Actions

**Deliverable:** Server actions and services for toggling bookmarks and fetching unread counts.
**Touches:** `src/services/item/toggle-bookmark.ts`, `src/services/feed/get-unread-counts.ts`, `src/actions/item/toggle-bookmark-action.ts`

**Todos:**

1. [x] Update `UnreadCounts` interface in `src/services/feed/get-unread-counts.ts` to include `saved: number`.
2. [x] Implement `toggleBookmark` service in `src/services/item/toggle-bookmark.ts` using `upsert` on `user_item_states`.
3. [x] Update `getUnreadCounts` service in `src/services/feed/get-unread-counts.ts` to calculate the unread bookmark count in parallel and include it in the response.
4. [x] Implement `toggleBookmarkAction` in `src/actions/item/toggle-bookmark-action.ts` with Zod validation. Ensure it supports both Guest and Member sessions.

**Done when:** Bookmarks can be toggled via a server action and the `getUnreadCounts` service returns the unread saved items count.

---

### Subtask 3: UI - Hooks & State Management

**Deliverable:** Client-side hooks for interacting with the bookmark feature.
**Touches:** `src/hooks/item/use-toggle-bookmark.ts`, `src/hooks/feed/use-unread-counts.ts`

**Todos:**

1. [x] Create `useToggleBookmark` hook using TanStack Query `useMutation` with optimistic updates.
2. [x] Update `useUnreadCounts` hook to reflect the updated `UnreadCounts` type (including `saved`).
3. [x] Ensure `useToggleBookmark` invalidates `["feeds", "unread-counts"]` and relevant items list queries.

**Done when:** Client components can toggle bookmarks and access the unread saved count from the unified unread counts hook.

---

### Subtask 4: UI - Component Groundwork

**Deliverable:** UI primitives updated for bookmark support.
**Touches:** `src/components/feed/item-card.tsx`, `src/components/layout/app-sidebar.tsx`

**Todos:**

1. [x] Update `ItemCard.Bookmark` to use the `useToggleBookmark` hook and show a filled icon when active.
2. [x] Create and integrate `SavedItemsBadge` in `AppSidebar` to show the unread bookmark count.

**Done when:** The sidebar and item cards correctly reflect and manipulate the bookmark state.

---

### Subtask 5: Hybrid Filtering Integration

**Deliverable:** "Saved" view integrated into the main Dashboard via URL state.
**Touches:** `src/hooks/feed/use-feed-filter.ts`, `src/app/(dashboard)/dashboard/page.tsx`, `src/app/api/items/route.ts`, `src/hooks/item/use-items.ts`, `src/components/feed/item-list.tsx`

**Todos:**

1. [x] Update `useFeedFilter` hook to support a `saved` boolean state (using `nuqs`).
2. [x] Implement a `goToSaved()` method in `useFeedFilter` that sets `saved: true` and clears `feedId`/`categoryId`.
3. [x] Update `itemsQuerySchema` in `src/lib/validations/feed.ts` to include the `saved` flag.
4. [x] Update `DashboardPage` to parse the `saved` parameter from the URL and pass it to the server-side prefetch.
5. [x] Update `AppSidebar` to trigger the `saved` filter using `goToSaved()` instead of navigating to a separate route.
6. [x] Update `ItemList` and `useItems` to automatically use the `saved` state from the hook to drive data fetching.

**Done when:** Clicking "Saved" in the sidebar updates the URL to `?saved=true`, clears other filters, and displays bookmarked items in the dashboard.

---

### Subtask 6: Advanced Saved Filters (The Refinement Widget)

**Deliverable:** A toolbar refinement system with multi-select dropdowns and state-compacting chips.
**Touches:** `src/hooks/feed/use-feed-filter.ts`, `src/components/layout/feed-toolbar.tsx`, `src/components/layout/components/saved-filter-dropdown.tsx`, `src/components/layout/components/active-filter-chips.tsx`

**Todos:**

1. [x] Update `useFeedFilter` to support multi-select (e.g., `feedIds: number[]`) and `unreadOnly: boolean`.
2. [x] Implement `SavedFilterDropdown` using shadcn `DropdownMenu` + `DropdownMenuCheckboxItem`.
    * Include sections for "Status" (Unread Only), "Categories", and "Individual Feeds".
    * Implement "Macro" logic: checking a category checks all its feeds.
3. [x] Implement `ActiveFilterChips` component:
    * Render a list of chips for every active filter (Unread, Categories, Feeds).
    * Implement "State Compaction": If all feeds in Category X are selected, render 1 "Category X" chip.
    * Implement "Refinement": If a feed is unchecked, break the Category chip into individual Feed chips.
4. [x] Implement a horizontally scrollable area below the `FeedToolbar` to house the chips.
    * Ensure the area is only visible when at least one refinement filter is active.
5. [x] Integrate components into `FeedToolbar`, rendering them only when `isSaved: true`.

**Done when:** Users can perform complex multi-source filtering on their saved items with clear, manageable UI feedback in a responsive layout.

---

### Tests: Bookmarks / Save for Later

**Deliverable:** all tests pass and every test would fail if the logic it targets were deleted.
**Touches:** `src/services/item/*.test.ts`, `src/actions/item/*.test.ts`, `src/components/feed/item-card.test.tsx`, `e2e/bookmarks.spec.ts`

**Todos:**

1. [x] **Server Integration**: Test `toggleBookmark` service (upsert logic, timestamping).
2. [x] **Server Integration**: Test `getUnreadCounts` (verify it includes accurate `saved` count).
3. [x] **Unit**: Test `toggleBookmarkAction` (session protection, input validation).
4. [x] **Hook Integration**: Test `useToggleBookmark` hook (optimistic updates, rollbacks, cache management).
5. [x] **UI Integration**: Test `ItemCard.Bookmark` reactivity and click isolation.
6. [x] **UI Integration**: Test "Compaction Logic" and "Macro/Micro" selection in `SavedFilterDropdown`.
7. [x] **E2E**: Full flow - bookmark items, toggle "Saved" view, filter by multiple sources, verify compaction, remove filters via chips.

**Done when:** all tests pass and every test would fail if the logic it targets were deleted

---

## Final checklist

* [ ] Happy path works end-to-end
* [ ] Errors are handled and displayed appropriately
* [ ] No existing functionality is broken
* [ ] Each subtask produces a standalone commit
* [ ] Env variables / configs documented
* [ ] No sensitive data exposed
* [ ] `bun tsc --noEmit` passes after each subtask before moving to the next
