# Frontend Feature Migration Plan

  ## Summary

  Migrate every user-facing capability supported by the current backend into the Next.js frontend through independently deployable PRs.
  Preserve the current design system and newer features while using commit b16452cff786771477eff3299eeade23462edb6d only as a behavioral
  reference.

  No backend files will be changed. Any missing, broken, or contradictory endpoint becomes a documented blocker requiring explicit approval
  before backend work.

  ## Phased Implementation

  ### PR 1 — Foundations and Quality Baseline

  - Fix the existing frontend lint failures and retain a green typecheck/build baseline.
  - Create a backend-to-frontend coverage matrix covering routes, roles, KYC requirements, request shapes, and corresponding UI.
  - Extend the typed API layer with consistent errors, pagination, query keys, cache invalidation, multipart upload handling, and role-
    aware routing.

  - Add Playwright with mocked API fixtures and CI execution.
  - Add shared public navigation/footer layouts and implement Terms and Privacy pages; remove or replace other dead public links.

  ### PR 2 — Complete Authentication and Security

  - Add /reset-password matching the backend email redirect.
  - Add /auth/callback for OAuth completion and role-aware dashboard routing.
  - Restore resend-confirmation, passwordless email OTP, and magic-link login flows.
  - Complete MFA enrollment, verification, factor listing, and disabling.
  - Preserve CSRF handling, session refresh, and safe redirect validation.
  - Add recovery, OAuth, MFA, and expired-token tests.

  ### PR 3 — Profiles, Skills, Wallet, and Settings

  - Make freelancer profile, skills, experience, and portfolio controls functional.
  - Add employer profile viewing and editing.
  - Integrate skill taxonomy search and freelancer custom-skill CRUD, including “suggest globally.”
  - Replace the hard-coded wallet with an EIP-1193 wallet connector showing address, balance, and network; handle account/network changes
    and persist through PATCH /auth/wallet.

  - Add role-specific settings for MFA, email preferences, storage quota/files, and personal audit activity.
  - Remove fake account deletion and earnings withdrawal actions because the backend does not support them.

  ### PR 4 — Search, Favorites, and Saved Searches

  - Replace client-only filtering with /search/projects and /search/freelancers.
  - Support URL-backed keyword, skills, budget, and continuation-token pagination.
  - Connect global search and category statistics to the backend.
  - Wire project and freelancer favorite controls and add /dashboard/{role}/saved.
  - Add saved-search create, edit, delete, notification preference, and execute flows.
  - Preserve filters when navigating between search results and detail pages.

  ### PR 5 — Projects, Proposals, and Matching

  - Add employer project editing and supported status transitions through PATCH /projects/:id; do not add hard deletion.
  - Finish project sharing and attachment presentation.
  - Add proposal detail, attachment access, and employer-history context.
  - Preserve submission, withdrawal, acceptance, rejection, and milestone creation while enforcing valid status-based actions.
  - Add full freelancer recommendations and skill-gap analysis.
  - Integrate employer freelancer recommendations into each project’s proposal/candidate view.
  - Add AI skill extraction as an optional project/profile form assistant, never as an automatic overwrite.

  ### PR 6 — Contract Workspace

  - Add employer contract list and role-specific contract detail routes:
      - /dashboard/employer/contracts/[id]
      - /dashboard/freelancer/contracts/[id]

  - Display participants, project, milestones, escrow/funding state, rush requests, refunds, disputes, reviews, and transaction history.
  - Add supported contract cancellation with confirmation and role/status guards.
  - Replace inert “View Contract” and contract action buttons throughout the frontend.
  - Add transaction filtering, detail presentation, and contract-specific transaction history.

  ### PR 7 — Funding and Milestone Delivery

  - Use backend-managed POST /contracts/:id/fund; never restore browser-side escrow deployment or accept frontend-supplied escrow
    addresses.

  - Show fund information, wallet prerequisites, funding progress, confirmations, failures, and retry-safe states.
  - Use /milestones as the canonical milestone API for:
      - Detail and contract milestone lists.
      - Deliverable upload and submission.
      - Employer approval and rejection with feedback.

  - Use the payment status endpoint for payment summaries and correct any stale client calls requiring contractId.
  - Apply a reusable KYC action guard before all protected mutations and link blocked users to their role-specific verification page.

  ### PR 8 — Rush Upgrades, Refunds, Reviews, and Reputation

  - Add employer rush-upgrade proposals and freelancer accept, decline, or counter-offer flows.
  - Add employer counter-offer acceptance/decline and request history.
  - Add refund request, history, approval, and rejection in contract details.
  - Use /reviews as the single post-contract review form with dimensional ratings and can-review eligibility checks.
  - Use reputation endpoints for aggregate score, breakdown, history, leaderboard, and blockchain metadata without creating duplicate
    ratings.

  - Only show blockchain explorer actions when the backend supplies a valid transaction or explorer reference.

  ### PR 9 — User Disputes and Evidence

  - Add /dashboard/{role}/disputes and /dashboard/{role}/disputes/[id].
  - Support dispute creation from eligible contracts or milestones.
  - Show status, participants, resolution, and linked contract context.
  - Support text, link, and file evidence; allow supported deletion and verification actions.
  - Keep administrative resolution in the existing admin dispute interface.
  - Replace all inert dispute buttons with eligibility-aware navigation or explanatory disabled states.

  ### PR 10 — Messaging and Notifications

  - Wire “Contact” and “Send Message” actions to role-correct conversations.
  - Add message attachment upload using the supported file API.
  - Preserve SSE updates, unread counts, read state, reconnection, and conversation deep links.
  - Add notifications for employer and admin dashboards, matching the existing freelancer experience.
  - Map notification types to project, proposal, contract, milestone, dispute, refund, rush-upgrade, review, KYC, and message destinations.
  - Use safe fallbacks when a notification references an unavailable resource.

  ### PR 11 — Administration and Remaining Backend Coverage

  - Add /dashboard/admin/skills for categories, global skills, deprecation, and custom-skill suggestion approval/rejection.
  - Complete KYC history and retry visibility for users and retain admin KYC review.
  - Confirm existing analytics, users, email inbox, system health, audit logs, and dispute tools cover their backend contracts.
  - Surface file storage usage and owned-file deletion without exposing internal storage identifiers unnecessarily.
  - Remove remaining hard-coded success states, dead buttons, and unsupported legacy controls.

  ### PR 12 — Integration Hardening and Release

  - Run the coverage matrix against every user-facing backend route and record intentional exclusions.
  - Add loading, empty, unauthorized, KYC-blocked, validation, rate-limit, stale-resource, and retry states across migrated screens.
  - Verify responsive layouts, keyboard navigation, focus management, form labeling, and color contrast.
  - Run full lint, typecheck, unit/contract tests, production build, and Playwright suites.
  - Perform staging acceptance with real employer, freelancer, and admin accounts before release.

  ## Frontend Interfaces and Types

  - Introduce typed contracts for saved searches, favorites, custom skills, file quota/files, rush upgrades, refunds, milestone
    deliverables, dispute evidence, reviews, reputation details, and paginated search results.

  - Split the API client into domain modules while retaining the shared authenticated Axios/CSRF transport.
  - Standardize list results around { items, metadata }, including continuationToken and hasMore.
  - Add reusable role-routing, KYC eligibility, action-status, wallet-provider, file-upload, and notification-destination helpers.
  - Treat backend identifiers and status unions as opaque contracts; do not reproduce legacy blockchain artifacts or infer unsupported
  ## Test Plan

  - Unit/contract tests for request serialization, response normalization, status guards, KYC guards, role routes, wallet events,
    notification destinations, and pagination.

  - Playwright tests with deterministic API interception for:
      - Registration, confirmation, login recovery, OAuth callback, and MFA.
      - Freelancer profile completion, search, favorite, proposal, and withdrawal.
      - Employer project creation/editing, proposal acceptance, contract funding, and milestone review.
      - Deliverable submission, rush negotiation, refund handling, reviews, and disputes.
      - Messaging attachments, notifications, saved searches, settings, and admin skill moderation.

  - CI gates: lint, TypeScript, all Node tests, production build, and Playwright.
  - Each PR must leave navigation free of dead links and only expose actions completed in that PR.

  ## Assumptions and Exclusions

  - The backend remains unchanged unless a separately approved backend task is created.
  - Endpoint mismatches are documented with request/response evidence; the affected slice pauses instead of adding frontend workarounds
    that violate backend rules.

  - Excluded legacy-only behavior includes Turnstile CAPTCHA, tutorial/onboarding state, client-side escrow deployment, unsupported project
    deletion, account deletion, earnings withdrawal, and local-only privacy settings.

  - Existing current-frontend features remain in place unless they are fake, broken, or superseded by a supported backend workflow.
  - Phased PRs are merged in order, with navigation entries added only when their complete workflow is available.
