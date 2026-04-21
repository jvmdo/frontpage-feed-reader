# Task: Fixup - Allow moving feeds out of categories

## Context

* **What can the user do?** The user can now remove (unassign) a feed from a category directly within the `AssignFeedsDialog`, moving it to the "Uncategorized" group.
* **Why are we building this?** Phase 4 provided ways to move feeds *into* categories but missed a streamlined way to move them *out* without opening individual edit dialogs.

## Prerequisites

* **Auth:** Authenticated user
* **Data:** `categories` and `subscriptions` tables exist
* **UI:** `AssignFeedsDialog` exists and is linked in `DashboardHeader` and `FeedItemList`.

## Use cases

* ✅ User opens `AssignFeedsDialog` for a specific category.
* ✅ Feeds already in the category are grouped at the top.
* ✅ "In Category" badge is replaced with an "Unassign" or "Remove" button.
* ✅ Clicking "Unassign" moves the feed to "Uncategorized" (null category).
* ✅ UI provides immediate feedback via toast and updates the grouped list.

---

## Subtasks

### Subtask 1: Refactor `AssignFeedsDialog` UI

**Deliverable:** A grouped list of feeds with dual "Move" and "Unassign" capabilities.
**Touches:** `src/components/category/assign-feeds-dialog.tsx`

**Todos:**

1. [x] Implement a `handleUnassign` function that calls `updateSubscription` with `categoryId: null`.
2. [x] Group the `subscriptions` array into `currentCategoryFeeds` and `availableFeeds`.
3. [x] Render two sections in the `ScrollArea`: "In this category" and "Available feeds".
4. [x] For "In this category" items, show an "Unassign" button (ghost variant, destructive hover) instead of the static badge.
5. [x] Ensure the "Available feeds" section still allows moving feeds from other categories (current behavior).

**Done when:** The dialog allows both adding and removing feeds from the target category, and the list is clearly organized.

### Subtask 2: Update Tests

**Deliverable:** Verified "unassign" flow.
**Touches:** `src/components/category/assign-feeds-dialog.test.tsx`

**Todos:**

* UI Integration:
  1. [ ] Add a test case for successfully unassigning a feed.
  2. [ ] Verify that feeds are correctly grouped into sections.
  3. [ ] Verify that the "Unassign" button triggers the correct server action call.

**Done when:** All tests pass and cover the new "move out" functionality.
