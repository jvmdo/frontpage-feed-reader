# Phase 1 - Step 4: Edit, Remove, and Refresh Feeds

## Context

* **What can the user do?** The user can update a subscription's title, remove a subscription with confirmation, and force a refresh of the feed metadata and health status directly from the management table.

* **Why are we building this?** This completes the basic management loop, allowing users to personalize their feed names, clean up their subscriptions, and manually trigger updates for sources they're following.

## Prerequisites

* **Auth:** Dev session (`getCurrentSession()`)
* **Data:** `feeds` and `subscriptions` tables must exist.
* **APIs / Services:** `fetchFeedMetadata` (Phase 1 - Step 2).
* **UI:** `FeedTable` and `FeedRow` from Phase 1 - Step 3.
* **Config:** Drizzle client and Query Client Provider.

## Tech stack decisions

* TanStack Query: for mutation state management and manual cache updates.
* `shadcn/ui` Dialog/AlertDialog: for edit and delete confirmation overlays.
* `lucide-react`: for refresh, edit, and delete icons.

## Use cases

* ✅ Update a subscription's `customTitle` and see the change reflected immediately.
* ✅ Remove a subscription after confirming in an Alert Dialog, with the row vanishing from the table.
* ✅ Refresh a feed's metadata (title, description, health status) and see the status badge update.
* ❌ Prevent unauthenticated users from performing management actions.
* ❌ Prevent users from modifying or deleting subscriptions they don't own.

---

## Subtasks

### Subtask 1: Data Layer - Feed & Subscription Services

**Deliverable:** Service functions for updating titles, deleting subscriptions, and updating feed metadata.
**Touches:** `src/services/feed.ts`

**Todos:**

1. [x] Implement `updateSubscription` in `src/services/feed.ts` (updates `customTitle`).
2. [x] Implement `deleteSubscription` in `src/services/feed.ts` (removes the subscription row).
3. [x] Implement `updateFeedMetadata` in `src/services/feed.ts` (updates fields in the `feeds` table).
4. [x] Implement `getSubscriptionWithFeed` in `src/services/feed.ts` (retrieves a single subscription joined with its feed metadata)

**Done when:** Functions can correctly modify and delete records in the database with appropriate owner verification (userId).

---

### Subtask 2: Business Logic - Server Actions & Validations

**Deliverable:** Validated server actions for management operations that return the updated data for cache synchronization.
**Touches:** `src/lib/validations/feed.ts`, `src/actions/feed.ts`

**Todos:**

1. [x] Define Zod schemas for update, remove, and refresh inputs in `src/lib/validations/feed.ts`.
2. [x] Implement `updateSubscriptionAction` in `src/actions/feed.ts`.
3. [x] Implement `removeSubscriptionAction` in `src/actions/feed.ts`.
4. [x] Implement `refreshFeedAction` in `src/actions/feed.ts`.
    * This action calls `fetchFeedMetadata`, then `updateFeedMetadata`, then returns the updated feed and subscription.

**Done when:** Management operations can be triggered via validated server actions that return `{ success, data }` or error shapes.

---

### Subtask 3: UI - Mutation Hooks & Cache Management

**Deliverable:** Custom hooks that wrap management actions in TanStack Query mutations and handle manual cache updates.
**Touches:** `src/hooks/useUpdateSubscription.ts`, `src/hooks/useRemoveSubscription.ts`, `src/hooks/useRefreshFeed.ts`

**Todos:**

1. [x] Implement `useUpdateSubscription` hook with `onSuccess` that updates the local `subscriptions` cache.
2. [x] Implement `useRemoveSubscription` hook with `onSuccess` that filters the deleted subscription out of the local cache.
3. [x] Implement `useRefreshFeed` hook with `onSuccess` that updates the specific feed's data in the cache.

**Done when:** Mutations are correctly updating the TanStack Query cache without requiring a full page refresh.

---

### Subtask 4: UI - Manage Feeds State Integration

**Deliverable:** A client-side wrapper that initializes the TanStack Query cache with server-provided data.
**Touches:** `src/components/feed/feed-manager.tsx`, `src/app/(dashboard)/manage-feeds/page.tsx`

**Todos:**

1. [x] Create `src/components/feed/feed-manager.tsx` as a Client Component that uses `useQuery` with `initialData` to manage the subscriptions list.
2. [x] Move `FeedTable` into `FeedManager`.
3. [x] Update `src/app/(dashboard)/manage-feeds/page.tsx` to use `FeedManager` instead of `FeedTable` directly.

**Done when:** The `/manage-feeds` page loads with server data but is now "wired" into TanStack Query for client-side state management.

---

### Subtask 5: UI - Management Dialogs & Interaction

**Deliverable:** Accessible dialogs for editing and deleting, and updating `FeedRow` to trigger them.
**Touches:** `src/components/feed/edit-subscription-dialog.tsx`, `src/components/feed/remove-subscription-dialog.tsx`, `src/components/feed/feed-row.tsx`

**Todos:**

1. [x] Implement `EditSubscriptionDialog` using shadcn Dialog and a Hook Form.
2. [x] Implement `RemoveSubscriptionDialog` using shadcn AlertDialog for destructive confirmation.
3. [x] Update `FeedRow.tsx` to handle "Refresh", "Edit", and "Delete" clicks using the new hooks and dialogs.

**Done when:** A user can successfully edit, delete, and refresh feeds through the UI with appropriate feedback and state updates.

---

### Subtask 6: UI - Proper State Management & Hydration

**Deliverable:** Reactive UI that handles empty/populated transitions correctly and avoids hydration mismatches.
**Touches:** `src/components/feed/feed-manager.tsx`, `src/app/(dashboard)/manage-feeds/page.tsx`, `src/components/shared/relative-date.tsx`, `src/actions/feed.ts`

**Todos:**

1. [x] Create `loading.ts` with a skeleton for this route.
2. [x] Move `EmptyState` logic into `FeedManager` to ensure it reacts to TanStack Query cache updates.
3. [x] Include `feeds` in the payload returned by `addFeedToUser`.
4. [x] Create `RelativeDate` client component to safely render relative timestamps and fix hydration errors.
5. [x] Update `useAddFeed` hook to manually update the cache when a new subscription is added.

**Done when:** The UI correctly transitions between empty states and data tables without page refreshes, and "Last Fetched" timestamps render without hydration warnings.

---

### Subtask 7: Tests

**Deliverable:** All tests pass and verify the management flows and UI state consistency.
**Touches:** `src/services/feed.test.ts`, `src/actions/feed.test.ts`, `e2e/feed-management.spec.ts`

**Todos:**

1. [x] Unit: Test service functions for correct DB updates and ownership checks.
2. [x] Integration: Test server actions with mocks for successful and failed external feed fetches.
3. [x] E2E: Playwright flow for:
    * [x] Adding a feed when the table is empty and seeing the table appear.
    * [x] Deleting the last feed and seeing the `EmptyState` reappear.
    * [x] Editing a title and verifying immediate UI update.
    * [x] Verifying "Last Fetched" relative time renders correctly.

**Done when:** All tests pass and verify both the backend logic and the reactive frontend state transitions.

---

## Final checklist

* [x] Happy path works end-to-end
* [x] Errors are handled and displayed appropriately
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] Env variables / configs documented
* [x] No sensitive data exposed
* [x] `bun tsc --noEmit` passes after each subtask before moving to the next
