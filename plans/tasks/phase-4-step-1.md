# Task: Update sidebar for category creation and display

## Context

* **What can the user do?** The user can create new categories via a dialog and see their subscriptions grouped by these categories in the sidebar.

* **Why are we building this?** To provide a better organization for high volumes of feeds, allowing users to triage content by topic or interest.

## Prerequisites

* **Auth:** Authenticated user (managed by `getCurrentSession` and middleware)
* **Data:** `categories` and `subscriptions` tables exist in PostgreSQL
* **UI:** `AppSidebar` and `SidebarSubscriptions` components already exist
* **Config:** Drizzle ORM configured

## Tech stack decisions

None.

## Use cases

* ✅ User can open a dialog to create a new category.
* ✅ Newly created category appears immediately in the sidebar (optimistic UI).
* ✅ Subscriptions are grouped by category name.
* ✅ Subscriptions without a category are grouped under "Uncategorized".
* ✅ Empty categories are displayed.
* ❌ Category creation with empty name is rejected.
* ❌ Category creation with duplicate name for the same user is rejected.

---

## Subtasks

### Subtask 1: Data layer and Business logic

**Deliverable:** Server action to create categories and services to fetch them.
**Touches:** `src/db/schema.ts` (types), `src/services/category/`, `src/actions/category/`, `src/app/api/categories/route.ts`

**Todos:**

1. [x] Create `src/services/category/create-category.ts` to insert a new category for a user.
2. [x] Create `src/services/category/get-user-categories.ts` to fetch all categories for a user.
3. [x] Create `src/actions/category/create-category-action.ts` server action with Zod validation (non-empty name, max length).
4. [x] Create `src/app/api/categories/route.ts` GET handler to return user categories.

**Done when:** A category can be created via the server action and retrieved via the service or API route.

---

### Subtask 2: Category UI and Sidebar Updates

**Deliverable:** A dialog to create categories and a sidebar that displays grouped subscriptions.
**Touches:** `src/hooks/use-categories.ts`, `src/components/category/add-category-dialog.tsx`, `src/components/layout/app-sidebar.tsx`, `src/components/layout/sidebar-subscriptions.tsx`, `src/app/(dashboard)/layout.tsx`

**Todos:**

1. [x] Create `src/hooks/use-categories.ts` Tanstack Query hook for fetching categories.
2. [x] Create `src/hooks/use-create-category.ts` Tanstack Query hook for mutate categories.
3. [x] Create `src/components/category/add-category-dialog.tsx` using shadcn dialog and `useCreateCategory`.
4. [x] Update `src/app/(dashboard)/layout.tsx` to prefetch categories query.
5. [x] Add "Add Category" button to `src/components/layout/app-sidebar.tsx`.
6. [x] Update `src/components/layout/sidebar-subscriptions.tsx` to fetch both subscriptions and categories.
    * Implement grouping logic in `SidebarSubscriptions` (Categories first, then Uncategorized).
    * Use `SidebarMenuSub` and related components to show feeds nested under categories.

**Done when:** The sidebar shows categories with their respective feeds, and empty categories are visible.

---

### Subtask 3: Tests

**Deliverable:** All tests pass and cover the new functionality.
**Touches:** `src/actions/category/create-category-action.test.ts`, `src/services/category/get-user-categories.test.ts`, `src/components/layout/sidebar-subscriptions.test.tsx`, `e2e/category-management.spec.ts`

**Todos:**

1. [x] Unit: Test `create-category-action` for validation and auth.
2. [x] Server Integration: Test `create-category` with PGLite.
3. [x] Server Integration: Test `get-user-categories` with PGLite.
4. [x] UI Integration: Test `SidebarSubscriptions` correctly groups feeds and handles empty categories.
5. [x] E2E: Test creating a category and seeing it appear in the sidebar with nested feeds.

**Done when:** All tests pass and every test would fail if the logic it targets were deleted.

---

## Final checklist

* [x] Happy path works end-to-end
* [x] Errors are handled and displayed appropriately
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] Env variables / configs documented
* [x] No sensitive data exposed
* [x] `bun tsc --noEmit` passes after each subtask before moving to the next
