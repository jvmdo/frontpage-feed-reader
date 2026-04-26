# UI Refactoring: Implementation Record

The `src/` UI has been successfully aligned with the `outsource/` design concept, utilizing the established Tailwind theme and shadcn/Radix UI components to deliver a high-fidelity, content-focused experience.

## 1. Global Layout Restructuring

The application shell has been redesigned to move from a standard sidebar-inset model to a layered, responsive layout.

- **File**: `src/app/(dashboard)/layout.tsx`
- **Key Changes**:
  - **TopNav Integration**: Added a permanent sticky header for brand and global navigation.
  - **Responsive Shell**: Wrapped content in a flex container that manages `TopNav`, `SidebarProvider`, and `BottomNav` (mobile only).
  - **Streamlined Containers**: Simplified nested structures by removing redundant `overflow-hidden` classes while ensuring `SidebarInset` correctly handles children with `min-h-0`.
  - **Fixed Header/Footer**: Restructured flex ordering to ensure navigation bars remain pinned while the main content area is scrollable.

## 2. Component Refactoring

### A. TopNav (New)

- **Path**: `src/components/layout/top-nav.tsx`
- **Implementation**:
  - **Brand**: Serialized italic logo with a primary-colored icon box.
  - **Navigation**: Adaptive alignment of "Feed", "Digest", and "Discover" links (right-aligned on mobile, left-aligned on tablet+).
  - **Utilities**: Desktop-only search bar with `kbd` shortcut indicator (`/`) that grows to fill available space.
  - **Profile**: Desktop-only user avatar and "Add Feed" shortcut.

### B. AppSidebar (Updated)

- **Path**: `src/components/layout/app-sidebar.tsx`
- **Implementation**:
  - **Conditional Branding**: Logo + Name appear only when rendered within a mobile `Sheet` (hamburger menu), avoiding redundancy with `TopNav` on larger screens.
  - **Action Grouping**: "Add Category" and "Add Feed" buttons moved above the subscriptions list, separated by clear visual boundaries.
  - **Sticky Health Status**: Footer refactored to feature a permanent "Feeds healthy" indicator linked to feed management.
  - **Scroll Control**: Integrated `ScrollArea` to ensure long subscription lists are navigable without affecting the layout shell.

### C. Sidebar Subscriptions (Refactored)

- **Path**: `src/components/layout/sidebar-subscriptions.tsx`
- **Implementation**:
  - **Grid Layout**: Transitioned items to `grid-cols-[1fr_auto]` to ensure unread counts and chevrons remain perfectly stable and visible.
  - **Truncation**: Applied `truncate` and `min-w-0` to label containers, preventing long names from overflowing or pushing indicators off-screen.
  - **Visual Hierarchy**: Refined collapsible categories and nested feed items for high-density navigation.

### D. BottomNav (New)

- **Path**: `src/components/layout/bottom-nav.tsx`
- **Implementation**:
  - **Mobile-only**: Fixed 14px footer (`md:hidden`) providing core interaction points on small screens.
  - **Unified Controls**: Houses the sidebar trigger (Menu), Search, and a "More" dropdown for layout/order toggles and bulk actions.

### E. FeedToolbar (New)

- **Path**: `src/components/layout/feed-toolbar.tsx`
- **Implementation**:
  - **Fixed Positioning**: Pinned at the top of the dashboard page, independent of the article list's scroll.
  - **Contextual Data**: Displays active feed/category title and unread count.
  - **Responsive Controls**: Desktop-only layout toggles and bulk actions; mobile-visible "Sync" button.
  - **Notification Banner**: Houses the "New items since last visit" placeholder.

### F. FeedItemCard (Refactored)

- **Path**: `src/components/feed/feed-item-card.tsx`
- **Implementation**:
  - **List Design**: Shifted from full cards to high-density list items with `border-b` separators.
  - **Metadata Line**: Prioritized Source Icon (letter-box or favicon) + Name + Relative Date.
  - **Enhanced Typography**: Semibold titles and line-clamped excerpts (2 lines) for better readability.
  - **Category Badges**: Dynamically displays the category name using an accent-colored `Badge`.
  - **Hover States**: Interactive save button and background highlight on hover for desktop.

### G. FeedIcon (Refactored)

- **Path**: `src/components/feed/feed-icon.tsx`
- **Implementation**:
  - **Avatar Integration**: Rebuilt using shadcn `Avatar` primitives for robust image lifecycle management.
  - **Letter-Box Fallbacks**: Styled fallback boxes that use the feed title's first letter when source assets are missing or broken.

## 3. Style & Theme Alignment

- **File**: `src/app/globals.css`
- **Changes**:
  - **Safe-Zone**: Locked `min-width: 320px` on `html` and `body` to prevent layout collapse on extra-small devices.
  - **Semantic Colors**: Mapped concept colors (e.g., `unread`) to established CSS variables (`--unread-indicator`).
  - **Typography**: Enforced the design's Serif/Sans hierarchy across all new components.

## 4. Data Layer Enhancements

- **Service**: `getUserFeedItems` now performs a left join on categories to include `categoryName` in the return set.
- **Types**: Extended `FeedItemWithSource` to support dynamic category metadata in article cards.

## 5. Deprecated & Unused Files

The following files were part of the previous sidebar-inset layout system and are no longer used or referenced by the new UI:

### Components in `src/components/layout/`

- **`dashboard-header.tsx`**: Functionality replaced by the new `FeedToolbar`.
- **`dashboard-header.test.tsx`**: Associated test file.
- **`dashboard-breadcrumb.tsx`**: Breadcrumbs were removed from the primary dashboard navigation.
- **`dashboard-breadcrumb.test.tsx`**: Associated test file.
- **`dashboard-breadcrumb-skeleton.tsx`**: Breadcrumb loading state.
- **`breadcrumb-error-fallback.tsx`**: Breadcrumb error boundary.
