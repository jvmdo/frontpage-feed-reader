# Task: Assign subscriptions to categories and filter feed items by category

## Context

* **What can the user do?** The user can assign a feed to a category and filter the feed items list by clicking on a category in the sidebar.

* **Why are we building this?** To allow users to organize their feeds into topical groups and consume content more focused by category.

## Prerequisites

* **Auth:** Authenticated user
* **Data:** `categories` and `subscriptions` tables exist; Phase 4 Step 1 completed (categories exist in sidebar).
* **UI:** `EditSubscriptionDialog` and `SidebarSubscriptions` exist.
* **Config:** Drizzle ORM, TanStack Query, nuqs for URL state.

## Tech stack decisions

None.

## Use cases

* ✅ User can select a category for a subscription in the Edit Subscription dialog.
* ✅ Subscription updates immediately with its new category (sidebar groups update).
* ✅ User can click on a category in the sidebar to filter the feed list by all subscriptions in that category.
* ✅ URL updates with `categoryId` and feed items list refreshes.
* ✅ Clearing filters (clicking "All Items") resets the view.
* ❌ Assigning to a non-existent category is rejected.

---

## Subtasks

### Subtask 1: Data layer and Business logic updates

**Deliverable:** Services and actions support category assignment and filtering.
**Touches:** `src/lib/validations/feed.ts`, `src/services/feed/update-subscription.ts`, `src/actions/feed/update-subscription-action.ts`, `src/services/feed/get-user-feed-items.ts`, `src/app/api/feeds/items/route.ts`

**Todos:**

1. [x] Update `updateSubscriptionSchema` in `src/lib/validations/feed.ts` to include optional `categoryId` (nullable number).
2. [x] Update `feedItemsQuerySchema` in `src/lib/validations/feed.ts` to include optional `categoryId` (coerce number).
3. [x] Update `updateSubscriptionAction` in `src/actions/feed/update-subscription-action.ts` to extract and pass `categoryId` to the service.
4. [x] Update `getUserFeedItems` in `src/services/feed/get-user-feed-items.ts` to accept `categoryId` in options and add filtering logic (joins `subscriptions` and filters by `subscriptions.categoryId`).
5. [x] Update `GET /api/feeds/items` in `src/app/api/feeds/items/route.ts` to parse and pass `categoryId` from query params.

**Done when:** The persistence layer supports category assignment and item filtering by category.

---

### Subtask 2: UI Category filtering logic

**Deliverable:** URL state and API handlers support category filtering with correct UI feedback.
**Touches:** `src/hooks/use-feed-filter.ts`, `src/hooks/use-feed-items.ts`, `src/app/(dashboard)/dashboard/page.tsx`, `src/components/layout/sidebar-subscriptions.tsx`, `src/components/layout/dashboard-breadcrumb.tsx`, `src/components/layout/app-sidebar.tsx`, `src/components/feed/feed-item-list.tsx`

**Todos:**

1. [x] Update `useFeedFilter` hook in `src/hooks/use-feed-filter.ts` to manage `categoryId` query state using `nuqs`.
2. [x] Update `useFeedItems` hook in `src/hooks/use-feed-items.ts` to include `categoryId` in the query key and API request.
3. [x] Update `DashboardPage` in `src/app/(dashboard)/dashboard/page.tsx` to prefetch based on `categoryId` from search params.
4. [x] Update `SidebarSubscriptions` in `src/components/layout/sidebar-subscriptions.tsx` to make category headers clickable (navigating to filtered dashboard view).
5. [x] Fix active state collision: Update `AppSidebar` to ensure "All Items" is only active when both `feedId` and `categoryId` are null.
6. [x] Update breadcrumbs: Update `DashboardBreadcrumb` to display the category name when `categoryId` is active.
    * Make sure to also implement nested breadcrumbs that show the parent category when a specific feed is selected.
7. [x] Fix misleading empty states: Update `FeedItemList` to display a specific empty state when a category filter is active but returns no items.

**Done when:** Clicking a category in the sidebar filters items, correctly highlights only the category, updates the breadcrumb, and shows category-specific empty states.

---

### Subtask 3: Assignment UI

**Deliverable:** Users can assign categories to feeds in the UI.
**Touches:** `src/components/feed/edit-subscription-dialog.tsx`, `src/components/feed/feed-item-list.tsx`, `src/hooks/use-update-subscription.ts`

**Todos:**

1. [x] Add a category selector (Select component) to `EditSubscriptionDialog` in `src/components/feed/edit-subscription-dialog.tsx`.
    * Fetch available categories in the dialog to populate the selector.
    * Bind the selector value to the form and pass it to the update mutation.
2. [x] Implement the category assignment action in `FeedItemList`'s empty state (opening a dialog).
3. [x] **Fix stale cache on move:** Update `useUpdateSubscription.ts` to invalidate `["feeds", "items"]` on success, ensuring that moving feeds between categories triggers a refetch of the item lists.

**Done when:** Users can change a feed's category via the Edit Subscription dialog and have a clear path to assign feeds when viewing an empty category.

---

### Subtask 4: Tests

**Deliverable:** All tests pass and cover assignment, filtering, and UX improvements.
**Touches:** `src/services/feed/get-user-feed-items.test.ts`, `src/actions/feed/update-subscription-action.test.ts`, `src/components/layout/dashboard-breadcrumb.test.tsx`, `src/components/feed/feed-item-list.test.tsx`, `e2e/category-filtering.spec.ts`

**Todos:**

1. [x] Unit: Test `updateSubscriptionAction` handles optional `customTitle` for surgical updates.
2. [x] Server Integration: Test `getUserFeedItems` with `categoryId` filter.
3. [x] UI Integration: Test `DashboardBreadcrumb` correctly renders nested paths (Frontpage > Category > Feed) and category links are clickable.
4. [x] UI Integration: Test `FeedItemList` displays category-specific empty states and the "Assign feeds" button.
5. [x] UI Integration: Test `AssignFeedsDialog` successfully moves a feed.
6. [x] UI Integration: Test `AppSidebar` active state correctly distinguishes between "All Items", specific categories, and individual feeds.
7. [x] E2E: Full organizational flow: Create a category, assign feeds via both dialogs, verify breadcrumb nesting, verify sidebar highlighting, and verify items list filtering.

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
