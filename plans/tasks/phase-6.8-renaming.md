# Renaming Registry: Normalized Naming Audit (100% Comprehensive)

This registry is the definitive source of truth for terminology, naming conventions, and specific updates required to achieve absolute normalization across the codebase.

## 1. Terminology Definitions

| Concept | Developer/DB Name | User-Facing Name | Decision |
| :--- | :--- | :--- | :--- |
| The RSS/Atom Source | `Feed` | `Source` / `Feed` | **`Feed`** |
| User's link to a Feed | `Subscription` | `Feed` | **`Subscription`** (Data Layer) / **`Feed`** (UI Layer) |
| Individual Entry | `FeedItem` | `Article` / `Item` | **`Item`** |
| Fetch/Parse Process | `Ingestion` | `Refresh` / `Sync` | **`Ingestion`** (Internal) / **`Refresh`** (User Action) |

## 2. Specific Normalization Rules

### A. Suffixes & Context

* **Preserve `Action`**: Server Actions MUST retain the `Action` suffix to prevent collisions with services and hooks (e.g., `addFeedAction`).
* **Drop `-user-`**: Redundant in user-scoped services. `getUserSubscriptions` → `getSubscriptions`.
* **Drop `-item-` where implied**: `markItemAsRead` → `markRead`.

### B. Domain Mapping

* **`Item` (Articles)**: Use `Item` instead of `FeedItem` or `Article` in internal code.
* **`Subscription` (User's Feeds)**: Use `Feed` for UI/Actions/Hooks; use `Subscription` for Services/DB.
* **Maintenance**: Global, non-user-scoped logic (CRONs, cleanups) belongs in `src/services/[domain]/tasks/` (e.g., `src/services/feed/tasks/cleanup-orphans.ts`).

---

## 3. Required Filename Changes

| Current Path | Proposed Path | Reason |
| :--- | :--- | :--- |
| `src/actions/feed-item/` | `src/actions/item/` | Domain consistency |
| `src/actions/feed-item/mark-as-read-action.ts` | `src/actions/item/mark-read-action.ts` | Concise + Suffix |
| `src/actions/feed/remove-subscription-action.ts" | `src/actions/feed/remove-feed-action.ts` | User-facing term |
| `src/services/feed/get-user-feed-items.ts` | `src/services/item/get-items.ts` | Service terminology |
| `src/services/feed/get-user-subscriptions.ts` | `src/services/subscription/get-subscriptions.ts` | Database terminology |
| `src/services/feed/mark-item-as-read.ts` | `src/services/item/mark-read.ts` | Concise |
| `src/services/feed/get-feed-item.ts` | `src/services/item/get-item.ts` | Concise |
| `src/hooks/use-feed-items.ts` | `src/hooks/use-items.ts` | Domain consistency |
| `src/hooks/use-feed-item.ts` | `src/hooks/use-item.ts` | Domain consistency |
| `src/hooks/use-mark-as-read.ts` | `src/hooks/use-mark-read.ts` | Action/Service alignment |
| `src/components/feed/feed-item-card.tsx` | `src/components/feed/item-card.tsx` | Concise |
| `src/components/feed/feed-item-list.tsx` | `src/components/feed/item-list.tsx` | Concise |
| `src/components/feed/remove-subscription-dialog.tsx` | `src/components/feed/remove-feed-dialog.tsx` | User-facing |
| `src/services/feed/add-feed-to-user.ts` | `src/services/subscription/create-subscription.ts` | Consistent terminology |
| `src/services/category/get-user-categories.ts` | `src/services/category/get-categories.ts` | Remove redundant context |
| `src/lib/feed/scroll-store.ts` | `src/lib/scroll-store.ts` | Shared UI state |

---

## 4. Required Symbol Changes

### A. Items (Articles)

* `FeedItemCard` → `ItemCard`
* `FeedItemList` → `ItemList`
* `FeedItemSkeleton` → `ItemSkeleton`
* `getUserFeedItems` → `getItems`
* `getFeedItem` → `getItem`
* `markAsReadAction` → `markReadAction`
* `markItemAsRead` → `markRead` (Service)
* `ingestFeedItems` → `ingestItems`
* `useFeedItems` → `useItems`
* `useFeedItem` → `useItem`
* `useMarkAsRead` → `useMarkRead`
* `FeedItem` (Type) → `Item`
* `FeedItemWithSource` (Type) → `ItemWithSource`
* `checkIsExcerpt` (Internal) → `isExcerpt`
* `neutralizeFocusableElements` (Internal) → `neutralizeHtml`

### B. Subscriptions (Feeds)

* `addFeedToUser` → `createSubscription`
* `removeSubscriptionAction` → `removeFeedAction`
* `getUserSubscriptions` → `getSubscriptions`
* `getSubscriptionWithFeed` → `getSubscription`
* `useSubscriptions` → `useFeeds`
* `useRemoveSubscription` → `useRemoveFeed`
* `SidebarSubscriptions` → `SidebarFeeds`
* `SidebarSubscriptionsSkeleton` → `SidebarFeedsSkeleton`
* `RemoveSubscriptionDialog` → `RemoveFeedDialog`

### C. Categories

* `getUserCategories` → `getCategories`
* `createCategoryAction` → `createCategoryAction`
* `updateCategoryAction` → `updateCategoryAction`
* `deleteCategoryAction` → `deleteCategoryAction`

### D. Generic / Shared

* `saveFeedScroll` → `saveItemsListScroll`
* `getFeedScroll` → `getItemsListScroll`
* `saveArticleScroll` → `saveItemReaderScroll`
* `getArticleScroll` → `getItemReaderScroll`

---

## 5. Verification Methodology

Every file in `src/` was scanned for function/const/class/type/interface keywords. This registry captures all public (exported) and private (internal) symbols that deviate from the new domain nouns (`Feed`, `Subscription`, `Item`, `Category`) or contain redundant user context.
