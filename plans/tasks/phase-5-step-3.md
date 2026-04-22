# Subtask: Bulk "Mark all as read"

## Context

* **What can the user do?** The user can mark all articles in the current view (Global, Category, or Feed) as read with a single click in the dashboard header.

* **Why are we building this?** To allow users to quickly clear out large volumes of content they are no longer interested in, maintaining a manageable unread count.

## Prerequisites

* **Auth:** Authenticated session.
* **Data:** Watermark fields exist in `user_preferences`, `categories`, and `subscriptions`.
* **UI:** `DashboardHeader` component is implemented.
* **Services:** `getUnreadCounts` and `getUserFeedItems` already support cascading watermarks.

## Tech stack decisions

* **Optimistic UI:** Instant update of unread counts and item visual states in the cache when the action is triggered.
* **Cascading Watermarks:** Instead of updating thousands of individual rows, we update a single timestamp watermark for the target scope (O(1)).

## Use cases

* ✅ Clicking "Mark all as read" in the "All Items" view updates the global watermark.
* ✅ Clicking "Mark all as read" in a Category view updates that category's watermark.
* ✅ Clicking "Mark all as read" in a Feed view updates that subscription's watermark.
* ✅ The button is only visible when there are unread items in the current view.
* ✅ Confirmation dialog prevents accidental bulk marking.

---

## Subtasks

### Subtask 1: Business Logic (Services)

**Deliverable:** A service that updates the appropriate watermark based on scope.
**Touches:** `src/services/feed/mark-all-read.ts` (new)

**Todos:**

1. [x] Implement `markAllRead` service function.
2. [x] Support `scope: 'global'`, `scope: 'category'`, and `scope: 'feed'`.
3. [x] Update the `markedAllReadAt` timestamp to `now()` for the target record.
4. [x] For `category` and `feed` scopes, ensure the record belongs to the user.

**Done when:** Watermarks are correctly updated in the database for all three scopes.

---

### Subtask 2: Business Logic (Server Actions)

**Deliverable:** A validated server action for bulk marking as read.
**Touches:** `src/actions/feed/mark-all-read-action.ts` (new), `src/lib/validations/feed.ts`

**Todos:**

1. [x] Define `markAllReadSchema` in `src/lib/validations/feed.ts` (scope and optional ID).
2. [x] Create `markAllReadAction` with authentication, validation and delegation.

**Done when:** The action is callable and correctly updates the database state.

---

### Subtask 3: UI (Dashboard Header)

**Deliverable:** A functional "Mark all as read" button in the dashboard.
**Touches:** `src/components/layout/dashboard-header.tsx`, `src/components/shared/confirm-button.tsx` (or similar)

**Todos:**

1. [x] Add a "CheckCheck" icon button or text button to `DashboardHeader`.
2. [x] Conditionally show the button only when `unreadCount > 0` for the current view.
3. [x] Wrap the action in a confirmation dialog (using `AlertDialog` from shadcn).
4. [x] Implement optimistic UI update to zero out the relevant unread counts in the query cache.

**Done when:** The user can trigger the bulk action from the UI and sees instant results.

---

### Subtask 4: Tests

**Deliverable:** Bulk marking logic is verified across all layers.
**Touches:** `src/services/`, `src/actions/`, `src/components/`, `e2e/`

**Todos:**

1. [x] Server Integration: Test `markAllRead` service for all three scopes, ensuring correct records are updated.
2. [x] Server Unit: Verify the action logic.
3. [x] UI Integration: Verify the "Mark all as read" behavior works for happy path and edge cases.
4. [x] E2E: "Mark category as read" -> verify all items in that category are dimmed and the category count becomes 0.

**Done when:** All tests pass and bulk read logic is verified.

---

## Final checklist

* [x] Global "Mark all as read" works.
* [x] Category-specific "Mark all as read" works.
* [x] Feed-specific "Mark all as read" works.
* [x] UI updates optimistically.
* [x] `bun tsc --noEmit` passes.
* [x] `bun run test` passes.
* [x] `bun run test:e2e` passes.
