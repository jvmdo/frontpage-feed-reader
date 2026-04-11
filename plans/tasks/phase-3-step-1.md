# Phase 3 - Step 1: Main Feed List View

## Context

* **What can the user do?** The user can see a unified, reverse-chronological list of all articles from their subscribed feeds on the dashboard.

* **Why are we building this?** This is the primary consumption surface of the application, providing the "What did I miss?" experience.

## Prerequisites

* **Auth:** Dev session (`getCurrentSession()`)
* **Data:** `feed_items`, `feeds`, and `subscriptions` tables must contain data (Phase 2).
* **UI:** Dashboard shell with Sidebar (Phase 1).
* **Config:** `RelativeDate` and `server-time-provider` (Phase 1).

## Tech stack decisions

* TanStack Query: for client-side data management and `queryClient` hydration (see an example in `src/app/(dashboard)/manage-feeds/page.tsx`).
* Lucide icons: for source identification and metadata.

## Use cases

* ✅ Display items from all subscribed feeds in one unified list.
* ✅ Items are sorted by `publishedAt` in descending order.
* ✅ Each item shows title, source name, favicon, relative date, and excerpt.
* ✅ Typography and spacing strictly follow the brand kit tokens.
* ✅ Empty state shown when the user has no subscriptions or no items ingested yet.
* ✅ Loading skeletons shown during initial fetch if no cache is present.
* ✅ Error state shown if something goes wrong.

---

## Subtasks

### Subtask 1: Business Logic - Feed Items Service

**Deliverable:** A service function to fetch joined feed items for a user.
**Touches:** `src/types/index.ts`, `src/services/feed/get-user-feed-items.ts`

**Todos:**

1. [x] Define `FeedItem` and `FeedItemWithSource` types in `src/types/index.ts` (infer from schema).
2. [x] Implement `getUserFeedItems(db, userId, options)` in `src/services/feed/get-user-feed-items.ts`.
    * Use a Drizzle query to join `feed_items` with `feeds` via the `subscriptions` table.
    * Order the results by `publishedAt DESC` then `createdAt DESC` as fallback.
    * Handle a default limit of 50 items.

**Done when:** the service returns a correctly sorted and joined list of items for a given userId.

---

### Subtask 2: Infrastructure - Feed Items Route Handler

**Deliverable:** An API endpoint that returns feed items for the current user.
**Touches:** `src/app/api/feeds/items/route.ts`

**Todos:**

1. [x] Implement `GET` handler in `src/app/api/feeds/items/route.ts`.
    * Ensure the request is authenticated using `getDevSession()`.
    * Call `getUserFeedItems` and return the result as JSON.

**Done when:** `GET /api/feeds/items` returns the joined feed items for the authenticated user.

---

### Subtask 3: UI - Feed Item Card

**Deliverable:** A polished, responsive card component for individual articles.
**Touches:** `src/components/feed/feed-item-card.tsx`

**Todos:**

1. [x] Build `FeedItemCard` using `src/types/index.ts`.
    * Implement visual hierarchy: Title (`--text-lg`, `--color-text-primary`) -> Source/Time (`--text-sm`, `--color-text-tertiary`) -> Excerpt (`--text-base`, `--color-text-secondary`).
    * Integrate 16px source favicon using `iconUrl` from the joined `feeds` table.
    * Use the `RelativeDate` component for timestamps.
    * Apply hover states: subtle shadow (`--shadow-sm`) and title color shift (`--color-accent`).
    * Implement mobile responsiveness: hide excerpt or truncate more aggressively on small screens.

**Done when:** The card renders correctly with the specified hierarchy and handles missing metadata gracefully.

---

### Subtask 4: UI - Feed List and State Management

**Deliverable:** A reactive list component that manages feed data with TanStack Query.
**Touches:** `src/components/feed/feed-item-list.tsx`, `src/components/feed/feed-item-skeleton.tsx`

**Todos:**

1. [x] Create `FeedItemSkeleton` that matches the visual shape of `FeedItemCard`.
2. [x] Implement `FeedItemList`
    * Use `useQuery` to fetch/manage feed items from `/api/feeds/items`.
    * Get initial data with `queryClient` hydration.
    * Handle the "Empty State" branch reactively (if `items.length === 0` after fetch).
    * Handle the "Error State" branch reactively.
    * Handle the "Loading State" branch reactively with skeletons.
    * Iterate over items and render cards.

**Done when:** The list renders either skeletons, items, or an empty state based on the current cache state.

---

### Subtask 5: UI - Dashboard Page Integration

**Deliverable:** The dashboard route `/dashboard` rendering real feed content.
**Touches:** `src/app/(dashboard)/dashboard/page.tsx`

**Todos:**

1. [x] Replace the existing shadcn placeholder blocks with the `FeedItemList`.
    * Fetch the initial list of items in the `DashboardPage` server component.
    * Get initial data on client with `queryClient` hydration

**Done when:** Navigating to `/dashboard` displays the user's real feed items in a reverse-chronological list.

---

### Subtask 6: Tests

**Deliverable:** Verification of the feed list logic and UI rendering.
**Touches:** `src/services/feed/get-user-feed-items.test.ts`, `e2e/dashboard-feed.spec.ts`

**Todos:**

1. [x] Unit: Test `getUserFeedItems` returns the expected number of items in the correct order for a specific user.
2. [x] Integration: Test `FeedItemList` render and state management. Mock with MSW.
3. [x] E2E (Playwright): Verify that the dashboard page renders items from multiple feeds and that the source name/favicon are visible.

**Done when:** All tests pass and cover the sorting and join logic.

---

## Final checklist

* [x] Happy path works end-to-end
* [x] Errors are handled and displayed appropriately
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] Env variables / configs documented
* [x] No sensitive data exposed
* [x] `bun tsc --noEmit` passes after each subtask before moving to the next
