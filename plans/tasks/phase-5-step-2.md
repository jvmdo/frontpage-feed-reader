# Subtask: Category & Feed Unread Counts

## Context

* **What can the user do?** The user can see unread counts for each individual category and subscription in the sidebar, as well as the unread count for the current view in the dashboard header.

* **Why are we building this?** To provide granular feedback on where new content is located, allowing users to prioritize specific categories or feeds that have many unread items.

## Prerequisites

* **Auth:** Authenticated session.
* **Data:** Phase 5 Step 1 must be complete (schema for read states exists).
* **UI:** `SidebarSubscriptions` and `DashboardHeader` components.
* **Services:** `getUnreadCounts` service (from Step 1).

## Tech stack decisions

* **SQL Aggregation:** Use Drizzle's `count` and `groupBy` to fetch all counts in a single efficient query.

## Use cases

* ✅ Categories in the sidebar display a badge with the total unread count of all feeds within that category.
* ✅ Individual feeds in the sidebar display a badge with their specific unread count.
* ✅ The Dashboard Header displays the unread count for the currently active category or feed.
* ✅ Counts update reactively when an item is marked as read.
* ✅ Badges are hidden when the count is 0.

---

## Subtasks

### Subtask 1: Business Logic (Service Update)

**Deliverable:** `getUnreadCounts` service returns counts for global, categories, and individual subscriptions.
**Touches:** `src/services/feed/get-unread-counts.ts`

**Todos:**

1. [x] Update `UnreadCounts` interface to include `categories: Record<number, number>` and `feeds: Record<number, number>`.
2. [x] Modify `getUnreadCounts` to perform a single query that selects `categoryId`, `feedId`, and `count(*)`, grouped by both.
3. [x] Post-process the database results into the `UnreadCounts` structure (calculating `global` and summing up `categories`).
4. [x] Ensure the query correctly handles `null` category IDs (uncategorized).

**Done when:** `getUnreadCounts` returns a detailed breakdown of unread items across all levels.

---

### Subtask 2: UI (Sidebar Badges)

**Deliverable:** Sidebar reflects unread counts for all organization levels.
**Touches:** `src/components/layout/sidebar-subscriptions.tsx`

**Todos:**

1. [x] Consume `useUnreadCounts` hook in `SidebarSubscriptions`.
2. [x] Add `SidebarMenuBadge` to the `CollapsibleTrigger` for each category group.
3. [x] Add `SidebarMenuBadge` (or `SidebarMenuSubBadge`) to individual subscription items.
4. [x] Ensure badges only render if the count is greater than zero.
5. [x] Apply `var(--color-text-tertiary)` or similar muted style for badges to match the minimal aesthetic.

**Done when:** All feeds and categories in the sidebar show accurate unread counts.

---

### Subtask 3: UI (Header Counts)

**Deliverable:** Dashboard header shows the unread count for the filtered view.
**Touches:** `src/components/layout/dashboard-header.tsx`

**Todos:**

1. [x] Update `getHeaderContent` to accept the full `unreadCounts` object instead of just `global`.
2. [x] Update the header logic to append `(X unread)` to the title when a category or feed is active and has unread items.
3. [x] Ensure the "All Items" view continues to show the global unread count.

**Done when:** The header title reflects the unread count for the current category or feed.

---

### Subtask 4: Tests

**Deliverable:** all tests pass and every test would fail if the logic it targets were deleted.
**Touches:** `src/services/feed/get-unread-counts.test.ts`, `src/components/layout/sidebar-subscriptions.test.tsx`, `src/components/layout/dashboard-header.test.tsx`

**Todos:**

1. [x] **Service Integration:** Verify `getUnreadCounts` returns correct values for specific categories and feeds, especially those with multiple subscriptions.
2. [x] **UI Integration (Sidebar):** Verify category badges show the SUM of their feeds' unread items.
3. [x] **UI Integration (Sidebar):** Verify subscription badges show the value of their feeds' unread items.
4. [x] **UI Integration (Header):** Verify filtering by a category with 3 unread items shows "Category Name 3 unread" in the header.

**Done when:** All counts are verified as accurate across all layers of the application.

---

## Final checklist

* [x] Happy path works end-to-end (read item -> all relevant badges decrement)
* [x] Counts are performant (no N+1 queries)
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] `bun tsc --noEmit` passes after each subtask before moving to the next
