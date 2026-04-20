# Task: Refactor Sidebar Category Navigation UX

## Context

* **What can the user do?** Clicking a category name in the sidebar now simultaneously filters the view and toggles the category's expansion state. The chevron has moved to the left as a subtle toggle indicator.
* **Why are we building this?** To improve navigation intuition and reduce the friction of having separate "filter" and "expand" interaction points.

## Prerequisites

* **Auth:** N/A
* **Data:** N/A
* **UI:** Existing `SidebarSubscriptions` component

## Use cases

* ✅ Clicking the category name updates the URL and toggles the list of feeds.
* ✅ Clicking the chevron toggles expanded/collapsed state of the list of feeds.
* ✅ The chevron is located to the left of the folder icon.
* ✅ The chevron rotates 90 degrees when the category is expanded.
* ✅ All existing tests are updated to reflect the new DOM structure and interaction patterns.

---

## Subtasks

### Subtask 1: Refactor `SidebarSubscriptions` Component

**Deliverable:** Streamlined category rows with unified interaction and left-side chevrons.
**Touches:** `src/components/layout/sidebar-subscriptions.tsx`

**Todos:**

1. [x] Remove the separate `SidebarMenuAction` and its `CollapsibleTrigger`.
2. [x] Wrap the `SidebarMenuButton` with a `CollapsibleTrigger` (using `asChild`).
3. [x] Move `ChevronRight` inside the `DashboardLink` content, positioned before the `FolderIcon`.
4. [x] Apply rotation styles to the chevron using `group-data-[state=open]/collapsible:rotate-90`.
5. [x] Adjust spacing and padding to ensure the left-side chevron looks "subtle" (e.g., smaller size, muted color).
6. [x] Ensure the chevron still acts as an individual hit target for expansion (by being part of the `CollapsibleTrigger`).
7. [x] Ensure a11y is fine.

**Done when:** Clicking any part of the category row toggles it and filters the dashboard, and the chevron is correctly positioned and styled on the left.

---

### Subtask 2: Update and Fix Tests

**Deliverable:** A passing test suite that reflects the new UI structure.
**Touches:** `src/components/layout/sidebar-subscriptions.test.tsx`, `src/components/layout/app-sidebar.test.tsx`

**Todos:**

1. [x] Identify all failing tests related to sidebar navigation and categories.
2. [x] Update selectors in `sidebar-subscriptions.test.tsx` to find the chevron on the left.
3. [x] Update interaction tests to verify that clicking the name now triggers both navigation (mocked) and toggle state.
4. [x] Fix any broken snapshots or structural assertions.

**Done when:** `bun run test` passes for all affected layout components.

---

## Final checklist

* [x] Happy path works end-to-end
* [x] Errors are handled and displayed appropriately
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] `bun tsc --noEmit` passes after each subtask
