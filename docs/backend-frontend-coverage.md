# Backend-to-frontend coverage

This matrix was audited on 2026-08-06 against `FreelanceXchain-api` commit `7a8ce97` on branch `Aug5`. The legacy frontend commit `b16452cff786771477eff3299eeade23462edb6d` was used only as a behavioral reference.

Status meanings:

- **Covered** — a current frontend screen or shared component calls the current API contract.
- **Transport** — used by the shared authentication, CSRF, upload, or SSE transport rather than a standalone screen.
- **Canonical alternative** — the backend exposes overlapping endpoints and the frontend intentionally uses the route designated by the migration plan.
- **Backend-only** — inbound webhook, crawler, monitoring, or privileged operator behavior that should not be initiated by the product UI.

## Covered product routes

| Capability | Current API routes | Access and KYC | Frontend coverage |
| --- | --- | --- | --- |
| Core authentication | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`; `GET /auth/me`; `PATCH /auth/wallet` | Public for registration/login; authenticated for session and wallet | Login/register flows, persisted auth store, safe role routing, settings wallet connector |
| Account recovery and confirmation | `POST /auth/forgot-password`, `/auth/reset-password`, `/auth/resend-confirmation` | Public, rate-limited | `/forgot-password`, `/reset-password`, `/resend-confirmation` |
| Passwordless login | `POST /auth/login/email-otp`, `/auth/login/magic-url`, `/auth/login/verify-token` | Public, rate-limited | `/passwordless`, `/auth/magic-url-callback` |
| OAuth | `GET /auth/oauth/:provider`; `POST /auth/oauth/callback`, `/auth/oauth/register` | Public, rate-limited | `/auth/callback`, including first-login role selection |
| MFA | `POST /auth/login/mfa-verify`, `/auth/mfa/enroll`, `/auth/mfa/verify-enrollment`, `/auth/mfa/disable`; `GET /auth/mfa/factors` | Authenticated except login verification | `/mfa/setup`, `/mfa/verify`, participant settings |
| CSRF | `POST /auth/csrf-token` | Public transport endpoint | Axios mutation interceptor refreshes and retries once after a CSRF validation failure |
| Email preferences | `GET/PATCH /email-preferences`; `POST /email-preferences/unsubscribe-all` | Authenticated | Employer and freelancer settings |
| Freelancer profile | `POST/GET/PATCH /freelancers/profile`; skill and experience child routes; `GET /freelancers/:id` | Freelancer writes; public profile reads | Freelancer profile editor and public freelancer detail |
| Employer profile | `GET/PATCH /employers/profile`; `GET /employers/:id` | Employer writes; public profile reads | Employer profile editor and project/employer context |
| Skill taxonomy | `GET /skills`; admin category/skill creation and deprecation routes | Public reads; admin writes | Search filters, profile/project forms, `/dashboard/admin/skills` |
| Custom skills | `POST/GET/PUT/DELETE /skills/custom...`; suggestion moderation routes | Freelancer CRUD; admin moderation | Freelancer custom-skill manager and admin suggestion queue |
| Portfolio | `POST /portfolio`; `GET /portfolio/freelancer/:id`, `/portfolio/:id`; `PATCH/DELETE /portfolio/:id` | Freelancer writes; public reads | `/dashboard/freelancer/portfolio` and public profile portfolio presentation |
| Project marketplace | `GET /search/projects`, `/projects/:id`, `/projects/stats/categories` | Public | URL-backed project search, taxonomy/budget filters, category statistics, detail and attachment presentation |
| Freelancer marketplace | `GET /search/freelancers`, `/freelancers/:id` | Public | URL-backed freelancer search, skill filters, detail and contact actions |
| Employer projects | `GET /projects/my-projects`, `POST /projects`, `/projects/with-attachments`, `POST /projects/:id/milestones`, `PATCH /projects/:id`, `GET /projects/:id/proposals` | Employer; protected mutations require approved KYC | Project list/create/edit/status changes, attachments, milestones, proposal management |
| Favorites | `POST/GET /favorites`; `DELETE /favorites/:type/:id` | Authenticated | Project/freelancer favorite buttons and both role-specific saved dashboards |
| Saved searches | `POST/GET/PATCH/DELETE /saved-searches...`; `POST /saved-searches/:id/execute` | Authenticated | Create, rename, alert preference, execute, delete, and restore filters |
| Proposals | `POST /proposals`; detail/history/list routes; accept/reject/withdraw routes | Role-specific; mutations require approved KYC | Submission with multipart attachments, freelancer detail/history, employer decisions, withdrawal |
| AI matching | `GET /matching/projects`, `/matching/freelancers/:projectId`, `/matching/skill-gaps`; `POST /matching/extract-skills` | Authenticated | Freelancer recommendations/skill analysis and employer candidate recommendations/project form assistant |
| Contracts | `GET /contracts`, `/contracts/:id`, `GET /contracts/:id/fund-info`, `POST /contracts/:id/fund`, `/contracts/:id/cancel`, `GET /contracts/:id/disputes` | Participants; mutations require approved KYC | Role-specific contract lists and workspaces, backend-managed funding, cancellation, related disputes |
| Milestones | `GET /milestones/contract/:contractId`; `POST /milestones/:id/submit-with-files`, `/approve`, `/reject` | Participant role; protected through contract workflow | Deliverable upload/submission and employer feedback/approval/rejection |
| Payment summary | `GET /payments/contracts/:contractId/status` | Contract participant | Contract payment status and milestone progress |
| Rush upgrades | Contract request/history and rush response/counter routes | Participant role; mutations require approved KYC | Contract negotiation panel for request, accept, decline, counter, and history |
| Escrow refunds | Request/history/approve/reject routes under `/escrow` | Participants; mutations require approved KYC | Contract negotiation panel with party/status guards |
| Transactions | `GET /transactions`, `/transactions/:id`, `/transactions/contract/:contractId` | Authenticated participant | Filtered transaction lists, details, and contract transaction history |
| Reviews | `POST /reviews`, `GET /reviews/user/:id`, `/reviews/can-review/:contractId` | Submit requires approved KYC | Post-contract dimensional review form, eligibility, and reputation reviews |
| Reputation | Score, breakdown, work history, reputation history, metadata, and leaderboard reads | Public reads | Participant reputation dashboards and `/leaderboard`; explorer data appears only when supplied |
| Participant disputes | `GET/POST /disputes`, `GET /disputes/:id`, evidence submit/list/delete routes | Participants; approved KYC required | Role-specific dispute list/detail routes, eligible creation, text/link/file evidence and deletion |
| Admin disputes | `GET /admin/disputes`, evidence verification, `POST /disputes/:id/resolve` | Admin | Admin dispute/evidence verification and resolution queue |
| Messages | Conversation/list/send/read/unread routes under `/messages` | Authenticated participants | Role-specific messaging, deep links, unread state, and file attachment metadata after supported upload |
| Notifications | List/read/read-all/unread/SSE routes under `/notifications` | Authenticated | All role notification centers, top-bar count, SSE reconnect, and safe resource destinations |
| User KYC | `POST /kyc/initiate`, `/kyc/refresh/:id`; `GET /kyc/status`, `/kyc/history` | Authenticated participant | Shared employer/freelancer verification center, history, continue/refresh, and 24-hour retry visibility |
| Admin KYC | Pending/status lists and review routes under `/kyc/admin` | Admin | `/dashboard/admin/kyc` review workflow |
| File upload | `POST /files/upload` | Authenticated, bucket allowlist and upload limits | Message attachments; project, proposal, milestone, dispute, and portfolio multipart workflows use their current canonical upload contracts |
| Owned file storage | `GET /file-management`, `/quota`; `DELETE /file-management/:bucket/:path` | Authenticated owner | Participant settings show quota/files and confirm owned-file deletion |
| Personal audit activity | `GET /audit-logs/me` | Authenticated | Role-specific activity pages |
| Admin audit | User/resource/action/failed/range/report/detail routes under `/audit-logs` | Admin | `/dashboard/admin/audit-logs` filters, reports, and detail presentation |
| Participant analytics | `GET /analytics/freelancer`, `/analytics/employer` | Authenticated | Role dashboards with empty/error fallback states |
| Admin analytics and users | `/admin/stats`, `/admin/analytics`, `/admin/users...` | Admin | Admin overview, analytics, user filtering/suspension/unsuspension/verification |
| Admin system health | `GET /admin/system/health` | Admin | `/dashboard/admin/system` with live database, storage, and uptime signals |
| Admin inbox | Inbox list/detail/update/delete/send/reply/unread routes | Admin | `/dashboard/admin/email` |

## Canonical alternatives and intentional exclusions

| Current backend route or behavior | Classification | Reason |
| --- | --- | --- |
| `GET /projects` for dashboard discovery | Canonical alternative | Public discovery and the freelancer dashboard use `/search/projects`; `/projects` remains for basic lists and internal participant reads. |
| `GET /employers/projects` | Canonical alternative | Employer management uses `/projects/my-projects`, which is the current project-domain contract. |
| `GET /skills/search`, `/skills/categories/:id/skills`, custom-skill search/detail | Canonical alternative | The UI loads the complete active taxonomy or owned custom-skill list, then uses the relevant item IDs. |
| `GET /favorites/check/:type/:id` | Canonical alternative | Marketplace pages load the user’s favorite set once, avoiding one request per card. |
| `GET /milestones/:id`, upload-only and submit-without-files milestone routes | Canonical alternative | Contract workspaces use the contract milestone list and `submit-with-files`, which supports existing and new deliverables in one operation. |
| Payment milestone complete/approve/dispute mutation routes | Canonical alternative | The plan designates `/milestones` as the mutation API and uses `/payments/contracts/:id/status` only for payment state. |
| `GET /reviews/:id`, `/reviews/project/:projectId` | Canonical alternative | Contract eligibility and user review history are the product surfaces required by the current workflow. |
| `GET /reputation/can-rate`, `POST /reputation/rate` | Canonical alternative | `/reviews` is the single rating write path; using both would create duplicate ratings. |
| `GET /kyc/verified`, `/kyc/profile-data` | Canonical alternative | Current auth/profile responses drive navigation and read-only identity fields; KYC status/history drive the verification UI. The backend profile services already derive approved identity data from KYC. |
| `GET /kyc/admin/verification/:id` | Canonical alternative | Admin status lists contain the fields required by the current review modal; review writes use the current admin review route. |
| `POST /kyc/admin/manual-verify` | Backend-only | This high-sensitivity operator workflow accepts raw ID and selfie files and is intentionally not exposed without a separately approved secure operations design. |
| File signed URL/list/delete routes under `/files` | Canonical alternative | Product uploads use `/files/upload`; owned file listing/quota/deletion use `/file-management`, which avoids exposing storage paths unnecessarily. |
| `GET /analytics/platform`, `/admin/platform-stats`, `/notifications/sse-stats` | Canonical alternative | Admin analytics, stats, system health, and live notification behavior already cover the product/operations surfaces without duplicate dashboards. |
| `/health`, root metadata, `robots.txt`, `sitemap.xml` | Backend-only | Monitoring and crawler endpoints, not interactive frontend actions. |
| Blockchain, KYC, and inbox webhook routes | Backend-only | Inbound provider callbacks must never be invoked from the browser. |
| Legacy client-side escrow deployment, project deletion, account deletion, earnings withdrawal, CAPTCHA, and local-only privacy/onboarding state | Unsupported legacy | No current approved backend product contract exists; controls remain absent rather than simulated. |

## Contract notes

- Protected frontend actions now mirror the latest middleware: only `approved` KYC is eligible. `completed` means under review and is blocked in the UI.
- Backend errors currently use both `{ error: { message } }` and `{ error: "message" }`; the shared error reader supports both shapes plus `{ message }`.
- Project, proposal, milestone, dispute, portfolio, and message attachment workflows preserve the backend field names and multipart limits used by their current routes.
- Inbound webhooks, blockchain provider behavior, real wallet balances/networks, email delivery, SSE longevity, and KYC provider redirects still require staging acceptance with configured external services.
