# Task: Refactor Refresh Feed to Support Scopes

Refactor the refresh feed functionality to support multiple scopes (global, category, feed), allowing users to refresh all feeds, feeds within a category, or a specific feed.

## Status

- **Phase**: Implementation
- **Progress**: 100%

## Subtasks

### 1. Update Validation Schema

- [x] Refactor `refreshFeedSchema` in `src/lib/validations/feed.ts` to a discriminated union:
  - `global`: no ID.
  - `category`: `id` (number).
  - `feed`: `id` (number).
- [x] Update `RefreshFeedInput` type.

### 2. Refactor Server Action

- [x] Create `src/services/feed/refresh-feeds.ts` to handle business logic.
- [x] Update `refreshFeedAction` in `src/actions/feed/refresh-feed-action.ts` to delegate to service.
- [x] Handle `global`, `category`, and `feed` scopes.
- [x] Use `Promise.allSettled` for concurrent ingestion of multiple feeds.

### 3. Update Hooks and Components

- [x] Refactor `useRefreshUI` in `src/hooks/ui/use-refresh-ui.ts` to derive scope.
- [x] Update `useRefreshFeed` hook to invalidate more queries.
- [x] Update `FeedToolbar` in `src/components/layout/feed-toolbar.tsx` to always render the button.
- [x] Update `FeedMenu` in `src/components/layout/components/feed-menu.tsx` to always show Refresh.
- [x] Update `FeedRow` in `src/components/feed/feed-row.tsx` to use scope-based API.

### 4. Update Tests

- [x] Create `src/services/feed/refresh-feeds.test.ts`.
- [x] Update `src/actions/feed/refresh-feed-action.test.ts`.
- [x] Create `src/hooks/ui/use-refresh-ui.test.ts`.
- [x] Update `src/components/layout/feed-toolbar.test.tsx`.
- [x] Consolidate `e2e/refresh-feed.spec.ts` into `e2e/manage-feeds.spec.ts`.
- [x] Update `e2e/refresh-feed-toolbar.spec.ts` with multi-scope tests.

## Verification Plan

### Automated Tests

- [x] Run `bun run test` to verify Vitest tests.
- [x] Run `bun run test:e2e` to verify Playwright E2E flows.

### Manual Verification

- [x] Navigate to "All Items" and click Refresh. Verify all feeds are refreshed.
- [x] Navigate to a Category and click Refresh. Verify only feeds in that category are refreshed.
- [x] Navigate to a specific Feed and click Refresh. Verify only that feed is refreshed.
- [x] Verify toast notifications are correct for each scope.
- [x] Verify the refresh button shows an loading spinner during the operation.
