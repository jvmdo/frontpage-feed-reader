# Phase 9: Landing Page

## Context

* **What can the user do?** Visitors can view a high-converting, editorial-style landing page that introduces the product's value and provides one-click access to the Guest Experience or Sign Up flow.

* **Why are we building this?** To create a professional first impression, communicate the "Your personalized front page" value proposition, and convert visitors into active users or guests.

## Prerequisites

* **Auth:** None (public page).
* **Data:** Requires Phase 8 Guest Mode logic to be functional for the "Try as Guest" CTA.
* **APIs / Services:** Better Auth flow (from Phase 7) for the "Sign Up" CTA.
* **UI:** Shared design tokens (Inter, Georgia fonts) and core ShadCN components (Button, Card, Accordion).
* **Config:** Metadata for SEO optimization.

## Tech stack decisions

* **Motion:** For staggered entrance animations and scroll-triggered reveals.
* **Georgia Font:** For massive display typography to achieve the "Editorial & Magazine" aesthetic.

## Use cases

* ✅ Visitors see a massive, high-contrast headline with smooth entrance animations.
* ✅ Visitors can instantly enter the Guest Mode from two distinct CTA locations.
* ✅ Visitors can navigate benefits, testimonials, and FAQs.
* ✅ Mobile visitors see a beautifully stacked version of the editorial layout.

* ❌ Page should not be slow to load due to unoptimized hero images.
* ❌ Broken routing if Guest Mode or Auth flows are not initialized.

---

## Subtasks

### Subtask 1: Establish the "Editorial & Magazine" design system

**Deliverable:** Tailwind configuration refinement and noise texture implementation leveraging existing `globals.css` tokens.
**Touches:** `globals.css`, `tailwind.config.ts`, `app/layout.tsx`

**Todos:**

1. [ ] Verify `font-serif` (Georgia) and `font-sans` (Inter) are correctly mapped for editorial hierarchy.
2. [ ] Implement SVG/CSS-based noise texture for the "magazine" feel background.
3. [ ] Set up the massive type scale (e.g., `text-6xl` or larger) using `font-serif` for hero headlines.

**Done when:** A blank page with a subtle noise texture and a `text-6xl font-serif` headline renders correctly.

---

### Subtask 2: Implement the Header and Hero Section

**Deliverable:** A sticky header and a massive hero section with primary/secondary CTAs and social proof.
**Touches:** `components/landing/Header.tsx`, `components/landing/Hero.tsx`, `app/page.tsx`, `app/layout.tsx`

**Todos:**

1. [ ] Update the root metadata in `app/layout.tsx` or `app/page.tsx` with SEO-optimized title and description.
2. [ ] Build the sticky header with brand logo and navigation links.
3. [ ] Implement the massive hero headline with Framer Motion staggered reveals.
4. [ ] Add "Try as Guest" (Primary) and "Sign Up" (Secondary) buttons with hover micro-interactions.
5. [ ] Add an animated "Social Proof" component (e.g., "Join 1,000+ tech pros").

**Done when:** The top of the landing page is visually complete and CTAs are functional.

---

### Subtask 3: Build Media Section and Benefits

**Deliverable:** Floating product screenshots with depth effects and an asymmetric feature grid.
**Touches:** `components/landing/MediaSection.tsx`, `components/landing/Benefits.tsx`

**Todos:**

1. [ ] Create floating device mockups with `next/image` and deep shadows for the reader view.
2. [ ] Implement the asymmetric "Core Benefits" grid using distinctive icons and editorial layout.
3. [ ] Apply scroll-triggered fade-ups for each benefit card.

**Done when:** The middle section of the page showcases the product visually and explains its value.

---

### Subtask 4: Add Testimonials, FAQ, and Final CTA

**Deliverable:** A complete bottom-of-page experience including reviews, common questions, and a second-chance CTA.
**Touches:** `components/landing/Testimonials.tsx`, `components/landing/FAQ.tsx`, `components/landing/FinalCTA.tsx`, `components/landing/Footer.tsx`

**Todos:**

1. [ ] Implement the editorial masonry testimonial grid with circular avatars.
2. [ ] Build the FAQ accordion using customized ShadCN components.
3. [ ] Create the dramatic, full-width Final CTA section echoing the "Try as Guest" hook.
4. [ ] Implement the multi-column footer with legal and contact links.

**Done when:** The landing page is fully scrollable and contains all 11 essential elements.

---

### Tests: Landing Page Verification

**Deliverable:** Comprehensive verification of responsiveness, routing, and performance.
**Touches:** `e2e/landing.spec.ts`

**Todos:**

1. [ ] E2E: Verify that "Try as Guest" routes to the dashboard with guest content.
2. [ ] E2E: Verify that "Sign Up" routes to the registration page.
3. [ ] UI: Verify mobile layout stacks correctly and touch targets are accessible.
4. [ ] Perf: Run Lighthouse to ensure LCP < 2.5s and accessibility score > 90.

**Done when:** All automated e2e tests pass and performance targets are met.

---

## Final checklist

* [ ] Happy path works end-to-end (Landing -> Guest/Auth)
* [ ] Errors are handled and displayed appropriately
* [ ] No existing functionality is broken
* [ ] Each subtask produces a standalone commit
* [ ] Env variables / configs documented
* [ ] No sensitive data exposed
* [ ] `bun tsc --noEmit` passes after each subtask before moving to the next
