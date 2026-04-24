# Subtask: Phase 6 - Step 3: Define a different reader UI for excerpt-only feeds

## Context

* **What can the user do?** When a user opens an article from a feed that only provides a summary/excerpt (e.g., paywalled or shortened feeds), they see a distinct UI clearly indicating that it is an excerpt, along with a prominent call-to-action to read the full article at the original source.
* **Why are we building this?** To set clear expectations for the user. Presenting an excerpt as if it were the full article is confusing. A dedicated UI guides the user to the original source to continue reading.

## Prerequisites

* **Auth:** Authenticated user.
* **Data:** `feed_items` must exist and contain varying levels of `content` and `description`.
* **UI:** `ReaderView` and `ReaderViewContent` from Phase 6 Step 1 must exist.

## Tech stack decisions

(No new libraries or patterns introduced).

## Use cases

* ✅ If an item has full content, it displays normally as a full article.
* ✅ If an item is an excerpt (no `content`, or `content` is identical/very similar to `description`), it displays the excerpt text.
* ✅ The excerpt UI includes a prominent "Read full article" button linking to the original `item.url`.
* ✅ The excerpt UI visually differs from the full article (e.g., different container styling, badge, or prominent CTA at the end).
* ❌ An excerpt should not be disguised as a full article.

---

## Subtasks

### Subtask 1: Business Logic & UI - Excerpt Detection and Rendering

**Deliverable:** `ReaderView` correctly identifies excerpt-only items and renders a distinct UI with a call-to-action.
**Touches:** `src/components/reader/reader-view.tsx`

**Todos:**

1. [ ] Add logic in `ReaderView` to determine if an item is an excerpt. A robust heuristic is: `!item.content || item.content === item.description || item.content.length < 200`.
2. [ ] Create an `ExcerptUI` component (or modify `ReaderViewContent`) to handle the excerpt state.
3. [ ] In the `ExcerptUI`, display the available text (usually `item.description` or `item.content`).
4. [ ] Add a prominent, full-width or highly visible CTA button (using shadcn `Button`) saying "Read full article on [Feed Title]" pointing to `item.url`.
5. [ ] Add an "Excerpt" badge or a visual indicator at the top of the content area to set expectations immediately.

**Done when:** Items identified as excerpts show a clear "Excerpt" indicator and a prominent CTA button leading to the original source.

---

### Subtask 2: Tests

**Deliverable:** The excerpt UI logic is fully tested in the component tests.
**Touches:** `src/components/reader/reader-view.test.tsx`

**Todos:**

1. [ ] Unit (RTL): Add a test case in `reader-view.test.tsx` with a mock item that has only a `description` and no `content`.
2. [ ] Unit (RTL): Verify that the "Excerpt" indicator or CTA button ("Read full article...") is rendered in the excerpt case.
3. [ ] Unit (RTL): Verify that a regular full-content item does NOT render the excerpt CTA.

**Done when:** Tests cover both full content and excerpt scenarios accurately.

---

## Final checklist

* [ ] Happy path works end-to-end for excerpt feeds
* [ ] Happy path remains working for full-content feeds
* [ ] CTA button correctly links to the original article in a new tab
* [ ] Typography and spacing match the Brand Kit
* [ ] Each subtask produces a standalone commit
* [ ] `bun tsc --noEmit` passes after each subtask
