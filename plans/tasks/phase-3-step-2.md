# Phase 3 - Step 2: Infinite Scroll

## Context

* **What can the user do?** The user can scroll through their feed items indefinitely without manual pagination, with new items loading automatically as they reach the bottom of the list.

* **Why are we building this?** To provide a seamless reading experience and maintain high performance even as the volume of feed items grows.

## Prerequisites

* **Auth:** Authenticated session (`getCurrentSession`)
* **Data:** `feed_items` table populated with enough data to test pagination (> 50 items).
* **APIs / Services:** `getUserFeedItems` service (already supports limit/offset).
* **UI:** `FeedItemList` component (Step 1).
* **Config:** TanStack Query initialized.

## Tech stack decisions

* `useInfiniteQuery` (TanStack Query): for managing paginated state, caching, and background fetching.
* `IntersectionObserver` API: for detecting when the user reaches the end of the list.

## Use cases

* ✅ Initial load fetches the first 20 items.
* ✅ Scrolling to the bottom triggers a fetch for the next 20 items.
* ✅ Loading indicator appears while fetching the next page.
* ✅ Scroll position is maintained as new items are appended.
* ✅ No redundant fetches when the end of the content is reached.

---

## Subtasks

### Subtask 1: Infrastructure - Paginated Route Handler

**Deliverable:** The feed items API supports pagination via query parameters.
**Touches:** `src/app/api/feeds/items/route.ts`

**Todos:**

1. [x] Update `src/app/api/feeds/items/route.ts` to read `limit` and `offset` from query parameters.
2. [x] Add Zod validation for pagination parameters with sensible defaults (limit: 20, offset: 0).
3. [x] Pass the validated `limit` and `offset` to the `getUserFeedItems` service.

**Done when:** `GET /api/feeds/items?limit=10&offset=10` returns the expected slice of items.

---

### Subtask 2: Business Logic - Infinite Query Hook

**Deliverable:** The feed items hook manages paginated state and fetching logic.
**Touches:** `src/hooks/use-feed-items.ts`, `src/app/(dashboard)/dashboard/page.tsx`

**Todos:**

1. [x] Refactor `useFeedItems` in `src/hooks/use-feed-items.ts` to use `useInfiniteQuery`.
2. [x] Implement `getNextPageParam` to return the next `offset` based on the length of current results.
3. [x] Update the `queryFn` to pass the `pageParam` as the `offset` in the API request.
4. [x] Update `DashboardPage` prefetch in `src/app/(dashboard)/dashboard/page.tsx` to use `prefetchInfiniteQuery`.

**Done when:** `useFeedItems` correctly fetches the first page and provides a function to fetch subsequent pages.

---

### Subtask 3: UI - Infinite Feed List

**Deliverable:** The feed list automatically loads more items as the user scrolls to the bottom.
**Touches:** `src/components/feed/feed-item-list.tsx`, `src/components/feed/infinite-scroll-trigger.tsx`

**Todos:**

1. [x] Create `src/components/feed/infinite-scroll-trigger.tsx` as a Client Component using `IntersectionObserver`.
2. [x] Update `FeedItemList` to consume the infinite query data structure by flattening `data.pages`.
3. [x] Place the `InfiniteScrollTrigger` at the bottom of the list, passing `fetchNextPage` as the callback.
4. [x] Add a loading skeleton at the end of the list that is visible when `isFetchingNextPage` is true.

**Done when:** Scrolling to the bottom of the feed list triggers a fetch and appends new items to the list.

---

### Subtask 4: Tests

**Deliverable:** Pagination and infinite scroll are verified by automated tests.
**Touches:** `src/components/feed/feed-item-list.test.tsx`, `e2e/infinite-scroll.spec.ts`

**Todos:**

1. [x] Update MSW handlers in `FeedItemList.test.tsx` to support the `offset` query parameter.
2. [x] Add integration test: verify that `fetchNextPage` is called when the trigger enters the viewport.
3. [x] E2E (Playwright): Verify that the list grows when scrolling down and that items are unique across pages.

**Done when:** All tests pass and verify the end-to-end infinite scroll behavior.

---

## Final checklist

* [x] Happy path works end-to-end
* [x] Errors are handled and displayed appropriately
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] Env variables / configs documented
* [x] No sensitive data exposed
* [x] `bun tsc --noEmit` passes after each subtask before moving to the next
