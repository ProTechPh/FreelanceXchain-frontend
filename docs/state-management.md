# State Management & Data Fetching

FreelanceXchain Frontend employs a dual-tier state architecture separating client UI state from remote server state.

---

## 1. Client State: Zustand Stores

Global client-only state and local persistence are managed via [Zustand](https://github.com/pmndrs/zustand).

### `authStore` (`src/stores/authStore.ts`)
- Tracks the active user profile, authenticated session tokens, connected Web3 wallet address, and current role (`employer`, `freelancer`, `admin`).
- Persists session tokens in browser storage and drives safe role routing across route guards.
- Dispatches CSRF token initialization upon login.

### `tourStore` (`src/stores/tourStore.ts`)
- Manages the interactive multi-step onboarding tour.
- Maintains local completion flags in `localStorage` and synchronizes progress with the backend via `GET /user-preferences` and `PATCH /user-preferences/tour-progress`.

---

## 2. Server State: TanStack React Query

Remote data fetching, caching, and mutation tracking use [@tanstack/react-query](https://tanstack.com/query/latest).

### Cache Policies & Invalidation
- **Query Keys:** Centralized in `src/lib/query-keys.ts` to ensure consistent invalidation targets.
- **Cache-Control Alignment:** The backend sends `Cache-Control: no-store` on all API responses, making React Query the primary cache layer in the browser.
- **Stale Times:** Configured per data sensitivity:
  - Analytics and dashboard metrics: 60s
  - Marketplace search and skill taxonomies: 5 minutes
  - Contract payment ledger and active milestone states: fresh on refetch
- **Mutation Invalidation:** Post-mutation hooks trigger targeted invalidation (e.g. invalidating `contracts`, `milestones`, and `user-profile` queries after approving a milestone or updating profile skills).

---

## 3. Network Transport & CSRF Protection

Network requests are managed via an Axios instance (`src/lib/api-client.ts`):

- **JWT Authentication:** Request interceptors inject the Bearer token from `authStore`.
- **CSRF Tokens (`src/lib/csrf-token.ts`):** Mutations (`POST`, `PUT`, `PATCH`, `DELETE`) include an `x-csrf-token` header fetched from `POST /auth/csrf-token`.
- **Automatic Retry:** If a mutation fails due to an expired CSRF token, the interceptor refreshes the CSRF token once and automatically retries the original request.
- **Error Normalization (`src/lib/error-messages.ts`):** Parses varied backend error response formats (`{ error: { message } }`, `{ error: "message" }`, `{ message }`) into uniform UI notifications.
