# Phase 7 - Step 2: Configure and Enable GitHub Social Login

## Context

* **What can the user do?** The user can sign in and sign up using their GitHub account.
* **Why are we building this?** Social login lowers friction for new users and provides a secure, trusted authentication method.

## Prerequisites

* GitHub account with access to Developer Settings.
* Better Auth core configuration is present in `src/lib/auth.ts`.
* `GithubButton` component already exists in `src/components/auth/github-button.tsx`.
* UI buttons for social login are already present in `SignupForm` and `SigninForm`.

## Tech stack decisions

* GitHub OAuth Application.
* Better Auth `socialProviders` configuration.

## Use cases

* ✅ User clicks "Continue with GitHub".
* ✅ User is redirected to GitHub authorization page.
* ✅ User authorizes the app and is redirected back to the dashboard.
* ✅ User account is created or matched automatically based on email.

---

## Subtasks

### Subtask 1: GitHub OAuth App Setup

**Deliverable:** GitHub Client ID and Client Secret.
**Touches:** GitHub Settings

**Todos:**

1. [ ] Create a new OAuth Application on GitHub (Settings > Developer Settings > OAuth Apps).
2. [ ] Set "Homepage URL" to `http://localhost:3000`.
3. [ ] Set "Authorization callback URL" to `http://localhost:3000/api/auth/callback/github`.
4. [ ] Generate and save the Client Secret.

**Done when:** You have both `Client ID` and `Client Secret` ready to be used in the application.

---

### Subtask 2: Environment Configuration

**Deliverable:** Updated `.env` file with GitHub credentials.
**Touches:** `.env`

**Todos:**

1. [ ] Add `GITHUB_CLIENT_ID` to `.env`.
2. [ ] Add `GITHUB_CLIENT_SECRET` to `.env`.

**Done when:** Environment variables are present in the local `.env` file.

---

### Subtask 3: Backend Configuration

**Deliverable:** GitHub provider enabled in Better Auth.
**Touches:** `src/lib/auth.ts`

**Todos:**

1. [ ] Update `auth` configuration in `src/lib/auth.ts` to include `socialProviders`:

    ```typescript
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      },
    },
    ```

**Done when:** The `auth` object is correctly configured with GitHub credentials.

---

### Subtask 4: Verification

**Deliverable:** Verified login flow via manual testing or network interception test.
**Touches:** `e2e/auth.spec.ts`

**Todos:**

1. [ ] (Manual) Verify that clicking "Continue with GitHub" redirects to GitHub.
2. [ ] Add a Playwright test case to `e2e/auth.spec.ts` to verify the GitHub button initiates a redirect to the correct provider URL using network interception.

**Done when:** The redirect initiation is verified by the test.

---

## Final checklist

* [ ] GitHub OAuth keys are correctly set in `.env`
* [ ] `src/lib/auth.ts` includes the `socialProviders` configuration
* [ ] E2E test verifies the redirect initiation
* [ ] `bun tsc --noEmit` passes
