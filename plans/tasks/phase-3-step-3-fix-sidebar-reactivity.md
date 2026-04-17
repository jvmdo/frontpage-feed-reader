# Task: Fix Sidebar Reactivity

## Context

* **What can the user do?** When a user adds a new feed, the subscription list in the sidebar updates immediately without a page refresh.

* **Why are we building this?** To ensure the UI remains in sync across all components after data mutations, providing a seamless and reactive experience.

## Prerequisites

* **Auth:** Authenticated session (Dev session bypass)
* **Data:** Subscriptions exist in the database.
* **APIs / Services:** `getUserSubscriptions` service exists.
* **UI:** `AppSidebar` and `SidebarSubscriptions` exist.
* **Config:** TanStack Query is configured.

## Tech stack decisions

* Next.js Route Handler for API endpoint.
* TanStack Query for client-side state management in the sidebar.

## Use cases

* ✅ Sidebar updates when a new feed is added via the Add Feed dialog.
* ✅ Sidebar updates when a subscription is renamed or deleted.
* ✅ Sidebar still loads initial data from the server for fast first paint.

---

## Subtasks

### Subtask 1: Infrastructure - Subscriptions Route Handler

**Deliverable:** A GET endpoint at `/api/feeds/subscriptions` that returns the current user's subscriptions.
**Touches:** `src/app/api/feeds/subscriptions/route.ts`

**Todos:**

1. [x] Create `src/app/api/feeds/subscriptions/route.ts`.
2. [x] Implement GET handler using `getCurrentSession()` and `getUserSubscriptions(db, userId)`.
3. [x] Return standardized JSON response.

**Done when:** `GET /api/feeds/subscriptions` returns the list of subscriptions for the authenticated user.

---

### Subtask 2: Business Logic - useSubscriptions Hook

**Deliverable:** A custom hook to fetch and manage subscriptions with TanStack Query.
**Touches:** `src/hooks/use-subscriptions.ts`

**Todos:**

1. [x] Create `src/hooks/use-subscriptions.ts`.
2. [x] Implement `useSuspenseQuery` with key `["subscriptions"]` that fetches `/api/feeds/subscriptions`.

**Done when:** The hook provides the subscription list and stays in sync with the query cache.

---

### Subtask 3: UI - Refactor Sidebar for Reactivity

**Deliverable:** `AppSidebar` and `SidebarSubscriptions` use the custom hook instead of static props.
**Touches:** `src/components/layout/app-sidebar.tsx`, `src/components/layout/sidebar-subscriptions.tsx`

**Todos:**

1. [x] Update `SidebarSubscriptions` to use the custom hook and ensure it's wrapped in `Suspense`.
2. [x] Update `DashboardBreadcrumb` to use the custom hook and ensure it's wrapped in `Suspense`.
3. [x] Update `AppSidebar` to use `prefetchQuery` + streaming pattern.
    * Ensure both `SidebarSubscriptions` and `DashboardBreadcrumb` are wrapped in `QueryErrorBoundary` and `Suspense`
4. [x] Ensure `useAddFeed` and `useRemoveSubscription` are correctly invalidating `["subscriptions"]`.

**Done when:** The sidebar updates its list automatically when mutations occur in other parts of the app.

---

### Subtask 4: Tests

**Deliverable:** Integration tests verifying that the sidebar reacts to cache invalidations after mutations.
**Touches:** `src/components/layout/app-sidebar.test.tsx`

**Todos:**

1. [x] Integration (RTL + MSW): Create a test setup that includes both the `AddFeedDialog` and the `AppSidebar` within a `QueryClientProvider`.
    * Mock the `GET /api/feeds/subscriptions` and `POST /api/feeds` (add feed action) endpoints.
    * Verify that triggering a successful "Add Feed" mutation causes the sidebar to re-fetch and display the new subscription.
    * Verify that deleting a feed (if removal logic is refactored) also reflects immediately in the sidebar.
2. [x] Fix tests that were affected by changes:
    * src/components/layout/sidebar-subscriptions.test.tsx
    * src/components/layout/dashboard-header.test.tsx

**Done when:** All integration tests pass and correctly simulate the cross-component reactivity.

---

## Final checklist

* [x] Happy path works end-to-end
* [x] Errors are handled and displayed appropriately
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] Env variables / configs documented
* [x] No sensitive data exposed
* [x] `bun tsc --noEmit` passes after each subtask before moving to the next
