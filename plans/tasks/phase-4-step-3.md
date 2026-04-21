# Task: Category Management (Dedicated Page)

## Context

* **What can the user do?** The user can manage the structure of their categories (rename and delete) on a dedicated management page.
* **Why are we building this?** To keep the sidebar focused on navigation and provide a spacious, intuitive interface for organization.

## Prerequisites

* **Auth:** Authenticated user
* **Data:** `categories` table and existing subscriptions
* **UI:** Dashboard layout with Sidebar and basic Category filtering

## Tech stack decisions

None.

## Use cases

* ✅ User can navigate to `/manage-categories` from the sidebar.
* ✅ User can rename a category inline or via a focused dialog on the management page.
* ✅ User can delete a category with a clear confirmation of where its feeds will go (Uncategorized).
* ✅ Clicking a category in the sidebar toggles its expansion AND filters the view simultaneously.
* ❌ Users cannot rename a category to a name that already exists for them.

---

## Subtasks

### Subtask 1: Business Logic (Services & Actions)

**Deliverable:** Robust CRUD operations for category modification.
**Touches:** `src/services/category/`, `src/actions/category/`, `src/lib/validations/category.ts`

**Todos:**

1. [x] Create `update-category.ts` service and `update-category-action.ts` server action.
2. [x] Create `delete-category.ts` service and `delete-category-action.ts` server action.
3. [x] Update `src/lib/validations/category.ts` with schemas for renaming (validation for length and presence).
4. [x] Ensure `delete-category` correctly triggers the reassignment of feeds to `null` category (handled by DB `ON DELETE SET NULL`).

**Done when:** Categories can be renamed and deleted via server actions with proper validation and ownership checks.

---

### Subtask 2: Category Management Page

**Deliverable:** A dedicated page at `/manage-categories` for structural changes.
**Touches:** `src/app/(dashboard)/manage-categories/page.tsx`, `src/components/category/`, `src/hooks/`

**Todos:**

1. [x] Create `useUpdateCategory.ts` and `useDeleteCategory.ts` hooks wrapping the server actions with Tanstack Query.
2. [x] Create the page shell at `src/app/(dashboard)/manage-categories/page.tsx` with header and breadcrumbs.
3. [x] Create `loading.tsx` and `error.tsx` to handle suspense-enabled data fetching and error states.
4. [x] Implement `RenameCategoryDialog` using `useUpdateCategory` within the list items.
5. [x] Implement `DeleteCategoryDialog` dialog using `useDeleteCategory` with clear explanation of the impact on subscriptions.
6. [x] Build `CategoryManagementList` component to display all user categories in a clean, list-based interface.
    * Include action buttons for rename and delete dialogs

**Done when:** Users can fully manage categories on the dedicated page with immediate visual feedback powered by Tanstack Query.

---

### Subtask 3: Sidebar UX Unification

**Deliverable:** A streamlined sidebar where categories are easier to navigate and manage.
**Touches:** `src/components/layout/app-sidebar.tsx`, `src/components/layout/sidebar-subscriptions.tsx`

**Todos:**

1. [x] Update `AppSidebar` to add a `SidebarGroupAction` (Settings/Edit icon) to the "Subscriptions" group that links to `/manage-categories`.

**Done when:** The sidebar is less "crowded" and clicking a category provides a unified expand + filter experience.

---

### Subtask 4: Tests

**Deliverable:** Full coverage of management logic and new UI flows.
**Touches:** `src/actions/category/*.test.ts`, `src/components/category/*.test.tsx`, `e2e/category-management.spec.ts`

**Todos:**

1. [x] Unit: Test `update` and `delete` actions for auth and validation.
2. [x] UI Integration: Update works as expect.
3. [x] UI Integration: Delete works as expect.
4. [x] E2E: verify full management flow in a single test.
    * Verify empty state
    * Creating a category and seeing the change reflected in both the page and the sidebar.
    * Renaming a category and seeing the change reflected in both the page and the sidebar.
    * Deleting a category and verifying its feeds move to "Uncategorized".

**Done when:** All tests pass and cover the transition to the dedicated management page.

---

## Final checklist

* [x] Happy path works end-to-end
* [x] Errors are handled and displayed appropriately
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] `bun tsc --noEmit` passes after each subtask
