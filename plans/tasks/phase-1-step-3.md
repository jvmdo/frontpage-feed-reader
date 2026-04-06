# Phase 1 - Step 3: Manage Feeds View

## Context

* **What can the user do?** The user can view a list of all their subscribed feeds in a dedicated management page, seeing each feed's title, URL, health status, and last fetch time.

* **Why are we building this?** This provides transparency into the state of the user's content sources and is the foundation for future management actions like editing and deleting.

## Prerequisites

* **Auth:** Dev session (`getCurrentSession()`)
* **Data:** `feeds` and `subscriptions` tables must exist (created in Step 2).
* **APIs / Services:** None.
* **UI:** Sidebar (Step 1) should have a link to this new page.
* **Config:** Drizzle client initialized.

## Tech stack decisions

* API Routes.
* `shadcn/ui` Table: for the feed list.
* `shadcn/ui` Badge: for health status indicators.
* `lucide-react`: for status icons (e.g., CheckCircle, AlertCircle, Clock).
* `date-fns`: for formatting "Last fetched" timestamps.

## Use cases

* ✅ Display all current subscriptions for the authenticated user.
* ✅ Show feed title (or URL if title is missing).
* ✅ Visually distinguish health statuses (Healthy, Stale, Error) using colored badges.
* ✅ Display a human-readable relative timestamp for the last successful fetch.
* ✅ Handle the "No feeds yet" state with a helpful empty state.

---

## Subtasks

### Subtask 1: Business Logic - Fetch Subscriptions Service

**Deliverable:** A service function that retrieves all subscriptions for a user, joined with their corresponding feed metadata.
**Touches:** `src/services/feed.ts`

**Todos:**

1. [x] Implement `getUserSubscriptions` in `src/services/feed.ts`.
    * Write a Drizzle query to join `subscriptions` with `feeds` for the given `userId`.
    * Order the results by `feeds.title` or `subscriptions.createdAt`.

**Done when:** the `getUserSubscriptions(userId)` returns a list of subscription-feed pairs from the database.

---

### Subtask 2: UI - Manage Feeds Page Shell & Routing

**Deliverable:** A new route `/manage-feeds` with the dashboard layout and a basic header.
**Touches:** `src/app/(dashboard)/manage-feeds/page.tsx`, `src/components/layout/app-sidebar.tsx`

**Todos:**

1. [x] Implement `page.tsx` in `src/app/(dashboard)/manage-feeds/` as a Server Component that uses the dashboard layout (inherited from `(dashboard)/layout.tsx`).
2. [x] Implement `error.tsx` in `src/app/(dashboard)/manage-feeds/`. The error boundary to catch exceptions for manage feeds page.
3. [x] Update `src/components/layout/app-sidebar.tsx` to include a navigation link to "Manage Feeds".

**Done when:** Navigating to `/manage-feeds` shows the dashboard chrome with a "Manage Feeds" title.

---

### Subtask 3: UI - Feed Table Component

**Deliverable:** A component that renders the list of feeds using shadcn Table Dropdown Menu and Badge primitives.
**Touches:** `src/components/feed/feed-table.tsx`

**Todos:**

1. [x] Create `src/components/feed/feed-table.tsx`.
2. [x] Define columns: Title, URL, Health Status, Last Fetched, Actions (3 dots).
3. [x] Create a Client Component `FeedRow.tsx` that renders the initial data received from its parent Server Component.
4. [x] Map `health_status` to shadcn `Badge` variants (e.g., success for healthy, warning for stale, destructive for error).
5. [x] Create the Dropdown Menu actions: edit, refresh, delete (just the UI for now).
6. [x] Format `lastSuccessAt` using `date-fns` (e.g., `formatDistanceToNow`).
7. [x] Implement an `EmptyState` component for when the user has no subscriptions. Return it directly from the page on server-side.

**Done when:** The `FeedTable` correctly renders provided feed data with appropriate styling and formatting.

---

### Subtask 4: UI - Integration

**Deliverable:** The `/manage-feeds` page fetching real data and passing it to the `FeedTable`.
**Touches:** `src/app/(dashboard)/manage-feeds/page.tsx`

**Todos:**

1. [x] Guarantee request is authenticated.
2. [x] Call `getUserSubscriptions` inside the `ManageFeedsPage` server component and pass data down to `FeedTable`.

**Done when:** The page displays the user's real subscriptions from the database.

---

### Subtask 5: Tests

**Deliverable:** All tests pass and verify the correct rendering of the feed list.
**Touches:** `src/services/feed.test.ts`, `src/components/feed/feed-table.test.tsx`, `e2e/manage-feeds.spec.ts`

OBS: populate before

**Todos:**

1. [x] Integration: Test `getUserSubscriptions` service with different database states.
2. [x] Integration: Test `FeedTable` renders various health statuses and timestamps correctly.
3. [x] E2E: Playwright test to verify navigating to Manage Feeds and seeing a subscribed feed in the list.

**Done when:** All tests pass and every test would fail if the logic it targets were deleted.

---

## Final checklist

* [ ] Happy path works end-to-end
* [ ] Errors are handled and displayed appropriately
* [ ] No existing functionality is broken
* [ ] Each subtask produces a standalone commit
* [ ] Env variables / configs documented
* [ ] No sensitive data exposed
* [ ] `bun tsc --noEmit` passes after each subtask before moving to the next
