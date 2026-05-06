# Subtask: Secure Dashboard Routes

## Context

* **What can the user do?** Unauthenticated users should be redirected to the sign-in page if they try to access any dashboard route. Authenticated users should be able to access the dashboard seamlessly.

* **Why are we building this?** To protect user data and ensure that the core aggregator features are only available to registered users.

## Prerequisites

* **Auth:** Better Auth configured with session management.
* **Data:** None.
* **APIs / Services:** Better Auth session API.
* **UI:** Sign-in page must exist (`/sign-in`).
* **Config:** `proxy.ts` support in Next.js 16.

## Tech stack decisions

* **Next.js Proxy (v16)**: Standard way to intercept requests and handle redirects based on auth state (renamed from `middleware`).
* **Zero-Branching Authentication**: A pure, industry-standard flow where the backend has no "dev" backdoors.
* **Cookie-Based Identity**: Reliability depends 100% on standard session cookies for both manual dev and automated tests.

## Use cases

* ✅ Unauthenticated user accessing `/dashboard` or subroutes is redirected to `/sign-in`.
* ✅ Authenticated user accessing `/dashboard` or subroutes can proceed.
* ✅ Authenticated user accessing `/sign-in` or `/sign-up` is redirected to `/dashboard`.
* ✅ Root path `/` redirects to `/dashboard` if authenticated.

---

## Subtasks

### Subtask 1: Pure Auth Foundation

**Deliverable:** A session library free of development fallbacks and header-based shortcuts.
**Touches:** `src/lib/session.ts`, `src/tests/session.ts`, `e2e/fixtures/test-extend.ts`

**Todos:**

1. [x] Remove all `x-test-user-id` and `if dev` branching from core session logic.
2. [x] Simplify `src/tests/session.ts` to only provide real session creation in the database.
3. [x] Update `e2e/fixtures/test-extend.ts` to rely 100% on injected session cookies for browser state.

**Done when:** `src/lib/session.ts` only knows how to read real cookies, and tests inject those cookies.

---

### Subtask 2: Implement Next.js Proxy Gatekeeper

**Deliverable:** A `proxy.ts` file that intercepts all relevant routes to enforce authentication.
**Touches:** `src/proxy.ts`

**Todos:**

1. [x] Create `src/proxy.ts` (Next.js 16).
2. [x] Define a matcher for dashboard and auth routes.
3. [x] Implement redirection logic: `/dashboard` -> `/sign-in` (if logged out), `/sign-in` -> `/dashboard` (if logged in).

**Done when:** Boundary security is enforced at the network level before any rendering starts.

---

### Subtask 3: Restore Dev DX (Auto-Login UI)

**Deliverable:** A secure, development-only way to authenticate without manual credentials.
**Touches:** `src/app/api/dev-login/route.ts`, `src/components/auth/signin-form.tsx`

**Todos:**

1. [x] Create a development-only API route `/api/dev-login` that issues a real session cookie for a dev user.
2. [x] Add an "Auto Login (Dev Only)" button to the Sign-In page that only renders in development mode.

**Done when:** Developers can bypass the login form with one click during local work while keeping production code clean.

---

### Subtask 4: Update App Routing and Landing Redirects

**Deliverable:** Seamless navigation between the public landing page and private dashboard.
**Touches:** `src/app/page.tsx`

**Todos:**

1. [x] Update the landing page (`/`) to automatically redirect logged-in users to the dashboard.
2. [x] Verify that `callbackUrl` logic correctly preserves user intent during interception.

**Done when:** Logged-in users never see the public landing page by mistake.

---

### Subtask 5: Comprehensive Verification

**Deliverable:** A stable, perfectly isolated E2E test suite.
**Touches:** `e2e/auth-guard.spec.ts`

**Todos:**

1. [x] Create `e2e/auth-guard.spec.ts` using random UUIDs for user isolation.
2. [x] Verify unauthenticated redirection to `/sign-in?callbackUrl=...`.
3. [x] Verify authenticated access and redirect avoidance.
4. [x] Run stress tests (`--repeat-each`) to ensure 100% stability.

**Done when:** all 36 test scenarios pass reliably across all browsers.

---

## Final checklist

* [x] Happy path works end-to-end
* [x] Errors are handled and displayed appropriately
* [x] No existing functionality is broken
* [x] Each subtask produces a standalone commit
* [x] Env variables / configs documented
* [x] No sensitive data exposed
* [x] `bun tsc --noEmit` passes after each subtask before moving to the next
