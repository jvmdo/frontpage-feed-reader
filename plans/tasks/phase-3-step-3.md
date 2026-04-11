# Phase 3 - Step 3: Individual Feed Filtering

## Context

* **What can the user do?** The user can click on an individual feed in the sidebar to view only the articles from that source.

* **Why are we building this?** As the number of subscriptions grows, users need the ability to focus on specific content sources without the noise of the unified feed.

## Prerequisites

* **Auth:** Dev session (`getCurrentSession()`)
* **Data:** `feed_items`, `feeds`, and `subscriptions` tables must contain data (Phase 2).
* **UI:** Dashboard shell with Sidebar (Phase 1).
* **Config:** `nuqs` configured for URL state management.

## Tech stack decisions

* `nuqs`: for type-safe URL state management of the `feedId` filter.
* TanStack Query: for caching and refetching filtered content.

## Use cases

* ✅ Clicking a feed in the sidebar updates the URL to `?feedId=<id>`.
* ✅ The feed list automatically refreshes to show only items from the selected feed.
* ✅ Infinite scroll works correctly within the filtered view.
* ✅ "All Items" link in the sidebar clears the filter.
* ✅ The selected feed is visually highlighted in the sidebar.
* ✅ The dashboard title or header reflects the selected feed name.

---

## Subtasks

### Subtask 1: Business Logic - Feed Items Service Filtering

**Deliverable:** `getUserFeedItems` service updated to handle an optional `feedId` filter.
**Touches:** `src/services/feed/get-user-feed-items.ts`

**Todos:**

1. [x] Update `GetUserFeedItemsOptions` interface to include optional `feedId: number`.
2. [x] Modify the Drizzle query in `getUserFeedItems` to include a conditional `and(eq(feedItems.feedId, feedId))` clause when `feedId` is provided.

**Done when:** The service correctly filters items by `feedId` when provided and returns all items otherwise.

---

### Subtask 2: Business Logic - API Route Update

**Deliverable:** `/api/feeds/items` route handler updated to parse and pass `feedId`.
**Touches:** `src/lib/validations/feed.ts`, `src/app/api/feeds/items/route.ts`

**Todos:**

1. [x] Update `feedItemsQuerySchema` in `src/lib/validations/feed.ts` to include an optional `feedId: z.coerce.number().int().optional()`.
2. [x] Update the `GET` handler in `src/app/api/feeds/items/route.ts` to extract `feedId` from `parseResult.data` and pass it to the service.

**Done when:** `GET /api/feeds/items?feedId=123` returns only items belonging to feed 123.

---

### Subtask 3: UI - Reactive Filtering with nuqs

**Deliverable:** A hook for managing the `feedId` URL state and updating the feed list.
**Touches:** `src/hooks/use-feed-filter.ts`, `src/components/feed/feed-item-list.tsx`

**Todos:**

1. [x] Create `src/hooks/use-feed-filter.ts` using `parseAsInteger` from `nuqs` to manage the `feedId` query parameter.
2. [x] Update `FeedItemList` to use the `feedId` from the hook.
3. [x] Update the TanStack Query key in `FeedItemList` to include `feedId` (e.g., `['feed-items', { feedId }]`).
4. [x] Ensure the "Empty State" component is shown if no items are found for the selected filter.

**Done when:** Changing the `feedId` in the URL triggers a TanStack Query refetch with the correct filter.

---

### Subtask 4: UI - Sidebar Subscription List

**Deliverable:** Sidebar renders real user subscriptions and handles filter updates.
**Touches:** `src/components/layout/app-sidebar.tsx`, `src/components/layout/sidebar-subscriptions.tsx`

**Todos:**

1. [x] Create `src/components/layout/sidebar-subscriptions.tsx` (Client Component).
2. [x] Fetch the user's subscriptions in the `AppSidebar` (or pass them down).
3. [x] Replace the hardcoded "Categories" section in `AppSidebar` with a "Subscriptions" group.
4. [x] Use the `useFeedFilter` hook in `SidebarSubscriptions` to handle clicks and set active state.
5. [x] Ensure clicking "All Items" clears the `feedId` via the hook.

**Done when:** The sidebar displays the user's real feeds and correctly highlights/updates the selected filter.

---

### Subtask 5: Tests

**Deliverable:** Verification of the filtering logic from service to UI.
**Touches:** `src/services/feed/get-user-feed-items.test.ts`, `src/components/layout/dashboard-header.test.tsx`, `e2e/feed-filtering.spec.ts`

**Todos:**

1. [x] **Server Integration:** Update `getUserFeedItems.test.ts` to verify the `feedId` filter correctly isolates items from a specific source.
2. [x] **UI Integration:** Create `dashboard-header.test.tsx` to verify the header and breadcrumb react correctly to different URL states.
3. [x] **UI Integration:** Test `SidebarSubscriptions` to ensure clicking a feed link triggers the expected navigation and shows the `LinkPendingIndicator`.
4. [x] **E2E:** Verify deep linking: loading `/dashboard?feedId=X` directly should show the filtered state with prefetched data (no loading flash).
5. [x] **E2E:** Verify the full flow: click feed in sidebar -> title updates -> list updates -> click "All Items" -> state resets.

**Done when:** All tests pass and cover the filtering logic end-to-end.

---

## Final checklist

* [x] Happy path works end-to-end
* [x] Errors are handled and displayed appropriately
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] Env variables / configs documented
* [x] No sensitive data exposed
* [x] `bun tsc --noEmit` passes after each subtask before moving to the next
