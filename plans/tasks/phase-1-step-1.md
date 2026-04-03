# Phase 1 - Step 1: Dashboard Layout and Add Feed Dialog

## Context

* **What can the user do?** The user can see the dashboard shell with a sidebar and trigger an empty "Add Feed" dialog.

* **Why are we building this?** To establish the primary application structure and navigation pattern.

## Prerequisites

* **Auth:** None (Dev session bypass during this phase)
* **Data:** None
* **APIs / Services:** None
* **UI:** Standard shadcn components (already installed)
* **Config:** `globals.css` updated with theme tokens

## Tech stack decisions

None.

## Use cases

* ✅ Sidebar is visible on desktop and collapsible.
* ✅ Main content area expands to fill remaining space.
* ✅ "Add Feed" button in sidebar opens a modal dialog.
* ✅ Dialog contains a placeholder URL input and "Add" button.

---

## Subtasks

### Subtask 1: UI - Dashboard Shell

**Deliverable:** A responsive dashboard layout with a functional sidebar and main content area.
**Touches:** `src/app/(dashboard)/layout.tsx`, `src/components/layout/app-sidebar.tsx`

**Todos:**

1. [x] Create `src/components/layout/app-sidebar.tsx` using the shadcn `Sidebar` component.
2. [x] Implement `src/app/(dashboard)/layout.tsx` using `SidebarProvider` and `SidebarInset`.
3. [x] Add a placeholder navigation group in the sidebar for "All Items" and "Saved".
4. [x] Ensure the layout respects the `brand-kit` widths (Sidebar: 16.25rem).

**Done when:** The dashboard shell renders with a functional sidebar and main content area.

---

### Subtask 2: UI - Add Feed Dialog UI

**Deliverable:** A dialog triggered from the sidebar that shows the UI for adding a new feed.
**Touches:** `src/components/feed/add-feed-dialog.tsx`, `src/components/layout/app-sidebar.tsx`

**Todos:**

1. [x] Create `src/components/feed/add-feed-dialog.tsx` using shadcn `Dialog`.
2. [x] Add a form shell inside the dialog with an `Input` for the feed URL and an "Add" button.
3. [x] Integrate the dialog trigger into a "Add Feed" button in the sidebar.

**Done when:** Clicking "Add Feed" in the sidebar opens a dialog with the correct form fields.

---

### Subtask 3: Tests

**Deliverable:** Playwright tests confirm the dashboard structure and dialog interactivity.
**Touches:** `e2e/dashboard-shell.spec.ts`

**Todos:**

1. [x] E2E (Playwright): Verify that the sidebar is visible on page load.
2. [x] E2E (Playwright): Verify that clicking "Add Feed" opens the dialog.
3. [x] E2E (Playwright): Verify that the dialog contains a URL input field.

**Done when:** All tests pass and cover the layout and basic dialog interactivity.

---

## Final checklist

* [ ] Happy path works end-to-end (Sidebar -> Dialog open)
* [ ] Errors are handled and displayed appropriately (Not applicable for this step)
* [ ] No existing functionality is broken
* [ ] Each subtask produces a standalone commit
* [ ] Env variables / configs documented (None needed)
* [ ] No sensitive data exposed
* [ ] `bun tsc --noEmit` passes after each subtask before moving to the next
