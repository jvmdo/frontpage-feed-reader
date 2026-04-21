# Subtask: Item Read State & Global Indicators

## Context

* **What can the user do?** The user can see which articles they haven't read via a blue dot indicator on the article card and a global count in the header/sidebar; articles automatically mark as read when the title link is clicked.

* **Why are we building this?** To help users triage their content and keep track of what they've already seen, which is a core feature of any feed reader and reduces information overload.

## Prerequisites

* **Auth:** Authenticated session (Dev session bypass is fine).
* **Data:** Existing `feeds`, `feed_items`, `subscriptions`, and `categories` tables.
* **UI:** `FeedItemList`, `FeedItemCard`, `AppSidebar`, and `DashboardHeader` components.

## Tech stack decisions

* **Optimistic UI:** Use TanStack Query mutations for instant unread indicator removal and count decrementation.
* **Cascading Watermarks:** Use a combination of individual item state (`user_item_states`) and timestamps (`marked_all_read_at`) to determine "read" status in O(1) for bulk actions.
* **Sparse State Pattern:** Only create rows in `user_item_states` when a user explicitly interacts with an item.

## Use cases

* ✅ New items appear with a blue unread dot and full opacity.
* ✅ Clicking an article title link marks it as read and removes the dot immediately (optimistically).
* ✅ Read items appear with reduced opacity and no blue dot.
* ✅ "All Items" count in Sidebar and Dashboard Header correctly reflects the total unread count.
* ✅ Marking an item as read in one view (e.g., "Frontend") updates the "All Items" total count.

---

## Subtasks

### Subtask 1: Infrastructure (Data Layer)

**Deliverable:** Database tables for user-specific item states and preferences exist.
**Touches:** `src/db/schema.ts`, `src/types/index.ts`

**Todos:**

1. [x] Add `user_item_states` table to `schema.ts` with fields: `user_id` (PK), `item_id` (PK), `read_at` (timestamp), `bookmarked_at` (timestamp).
2. [x] Add `user_preferences` table to `schema.ts` with fields: `user_id` (PK), `marked_all_read_at` (timestamp - global watermark), `layout` (text).
3. [x] Export table schemas and define Drizzle relations.
4. [x] Update `FeedItemWithSource` type in `src/types/index.ts` to include `isRead: boolean`.
5. [x] Update `Category` and `Subscription` types if needed (though `markedAllReadAt` should already be present from Phase 4).

**Done when:** `bun tsc --noEmit` passes and the schema reflects the `db-design.md` for read states.

---

### Subtask 2: Business Logic (Services)

**Deliverable:** Service functions can correctly calculate and aggregate unread states.
**Touches:** `src/services/feed/get-user-feed-items.ts`, `src/services/feed/get-unread-counts.ts` (new)

**Todos:**

1. [x] Update `getUserFeedItems` to LEFT JOIN with `user_item_states` and `user_preferences`.
2. [x] Implement `isRead` calculation in `getUserFeedItems` using the cascading logic: `isRead = (publishedAt <= watermarks) OR (read_at IS NOT NULL)`.
3. [x] Create `getUnreadCounts` service that returns an object containing the global unread count.
4. [x] Ensure unread counts respect the same cascading watermark logic as individual items.

**Done when:** `getUserFeedItems` returns correct `isRead` flags for a user.

---

### Subtask 3: Business Logic (Server Actions)

**Deliverable:** An article can be marked as read in the database via a server action.
**Touches:** `src/actions/feed-item/mark-as-read.ts` (new), `src/lib/validations/feed.ts`

**Todos:**

1. [x] Define `markAsReadSchema` in `src/lib/validations/feed.ts`.
2. [x] Create `markItemAsRead` server action that upserts a row into `user_item_states` for the given item and user.
3. [x] Implement validation and error handling for the action.

**Done when:** Calling `markItemAsRead` successfully inserts/updates a row in `user_item_states`.

---

### Subtask 4: API & Hooks (Glue)

**Deliverable:** A reactive hook provides unread counts to UI components.
**Touches:** `src/app/api/feeds/unread-counts/route.ts` (new), `src/hooks/use-unread-counts.ts` (new)

**Todos:**

1. [x] Create GET `/api/feeds/unread-counts` endpoint that calls the unread count service.
2. [x] Implement `useUnreadCounts` hook using TanStack Query to fetch and cache global/category/feed counts.
3. [x] Add `markItemAsRead` optimistic mutation logic to the item list or a new hook.

**Done when:** The unread count can be fetched via a client-side hook.

---

### Subtask 5: UI (Item Indicators)

**Deliverable:** Feed items visually reflect their read/unread status and react to clicks.
**Touches:** `src/components/feed/feed-item-card.tsx`

**Todos:**

1. [x] Add unread indicator (blue dot) to `FeedItemCard` using `var(--color-unread-indicator)`.
2. [x] Apply conditional styling to `FeedItemCard` (e.g., `opacity-60` and `text-text-secondary` for read items).
3. [x] Add `onClick` handler to the article title link that triggers `markItemAsRead`.
4. [x] Ensure the click handler uses optimistic updates to hide the indicator immediately.

**Done when:** Clicking an item makes its blue dot disappear and its text dim instantly.

---

### Subtask 6: UI (Sidebar & Header)

**Deliverable:** The global unread count is visible and accurate in the dashboard.
**Touches:** `src/components/layout/app-sidebar.tsx`, `src/components/layout/dashboard-header.tsx`

**Todos:**

1. [x] Update `AppSidebar` to replace the hardcoded "12" with the real global count from `useUnreadCounts`.
2. [x] Update `DashboardHeader` to display the unread count for the current view (e.g., "All Items (5)").
3. [x] Ensure counts update reactively when an item is marked as read.

**Done when:** Sidebar and Header counts are no longer hardcoded and reflect the real database state.

---

### Subtask 7: Tests

**Deliverable:** all tests pass and every test would fail if the logic it targets were deleted.
**Touches:** `src/tests/`, `e2e/`, `src/services/`, `src/actions/`, `src/hooks/`, `src/components/`

**Todos:**

1. [x] **Server Unit (Actions & API):**
    * `mark-as-read-action.test.ts`: Verify it rejects unauthenticated users and invalid item IDs.
    * `unread-counts/route.test.ts`: Verify the API returns the correct data structure and handles errors gracefully.

2. [x] **Server Integration (Services):**
    * `get-unread-counts.test.ts`: Verify unread count correctly excludes items read via global, category, and feed watermarks.
    * `get-unread-counts.test.ts`: Verify unread count correctly excludes items with explicit `read_at` in `user_item_states`.
    * `get-user-feed-items.test.ts`: Verify the `isRead` boolean is correctly computed for items across all watermark levels and individual states.
    * `mark-item-as-read.test.ts`: Verify the upsert logic—ensure multiple reads for the same item update the timestamp rather than failing.

3. [x] **UI Integration (Components):**
    * `feed-item-card.test.tsx`: Verify the blue unread indicator dot and left-border are present ONLY when `isRead` is false.
    * `feed-item-card.test.tsx`: Verify clicking the link calls the mutation and triggers optimistic styling (dimming).
    * `app-sidebar.test.tsx`: Verify the "All Items" badge displays the `global` count from the hook.
    * `dashboard-header.test.tsx`: Verify the title includes `(count)` only when in "All Items" view and count > 0.

4. [x] **E2E (Playwright):**
    * `unread-flow.spec.ts`: Log in, identify an unread item, click it, verify the blue dot disappears, and the sidebar badge count decrements by 1.

**Done when:** all tests pass and coverage for read/unread logic is confirmed across all layers.

---

## Final checklist

* [x] Happy path works end-to-end (click article -> state updates)
* [x] Errors are handled and displayed appropriately
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] `bun tsc --noEmit` passes after each subtask
