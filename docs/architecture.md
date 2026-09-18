# Frontend Architecture Overview

FreelanceXchain Frontend is built on **Next.js 16 (App Router)** using **React 19**, **TypeScript 6**, and **Tailwind CSS v4**.

---

## 1. Directory Structure

```
src/
├── app/                  # Next.js App Router root
│   ├── (auth)/           # Authentication route group (login, register, forgot-password, mfa)
│   ├── dashboard/        # Role-gated dashboard surfaces
│   │   ├── admin/        # Platform governance, KYC review, dispute arbitration, audit logs
│   │   ├── employer/     # Project management, proposal review, milestone approval, subscriptions
│   │   └── freelancer/   # Proposal submission, deliverables upload, portfolio, earnings
│   ├── projects/         # Marketplace project search and detail views
│   ├── freelancers/      # Marketplace freelancer search and public profile views
│   └── contracts/        # Live contract workspaces, milestone escrow tracker, negotiation panel
├── components/           # Reusable UI component library
│   ├── ui/               # Base UI and Radix primitives (button, modal, dropdown, card, input)
│   ├── layout/           # Header, navigation, footer, role-specific sidebars
│   ├── auth/             # Wallet connect button, MFA enrollment, role switcher
│   └── forms/            # Project creation, proposal submission, review modals
├── hooks/                # Custom React hooks (wallet, media query, auth guard, notifications)
├── lib/                  # Pure utility modules, API clients, contract ABIs, formatters
├── stores/               # Zustand client-side persistent stores (authStore, tourStore)
└── types/                # Shared TypeScript contracts and domain models
```

---

## 2. Route Groups & Role-Based Navigation

The application enforces strict role-based views and middleware checks:

- **Public Surfaces:** `/`, `/projects`, `/freelancers`, `/leaderboard`, `/crypto-news`
- **Authentication Flows (`(auth)`):** `/login`, `/register`, `/passwordless`, `/mfa/verify`, `/auth/callback`
- **Employer Workspaces (`/dashboard/employer`):**
  - Project creation with milestone definitions.
  - Candidate recommendation powered by backend AI matching.
  - Escrow milestone funding, approval, and dispute triggers.
  - Stripe subscription and billing tier upgrades.
- **Freelancer Workspaces (`/dashboard/freelancer`):**
  - Proposal submissions with multipart portfolio/document attachments.
  - Milestone deliverable submissions (`submit-with-files`).
  - Earnings tracking and on-chain reputation dashboard.
- **Admin Operations (`/dashboard/admin`):**
  - Didit KYC manual review and verification overrides.
  - Multi-party dispute evidence evaluation and arbitration resolution.
  - System health, server-side audit logs, and error-budget metrics.

---

## 3. UI Component System & Styling

The frontend styling follows a modern component architecture:
- **Tailwind CSS v4:** Zero-config CSS variables-based theme setup (`@theme`) with dark/light mode toggling via `next-themes`.
- **Primitives:** Built on top of `@radix-ui` and `@base-ui/react` primitives to ensure full keyboard navigation and WCAG 2.2 AA accessibility compliance.
- **Animations:** Lightweight spring and layout animations powered by `motion`.
- **Toasts:** Contextual toast alerts managed with `sonner`.
- **Icons:** Consistent iconography using `lucide-react`.

---

## 4. Verification & Quality Gates

The frontend enforces strict verification scripts prior to release:
- `pnpm verify:contrast`: Checks color contrast ratios against WCAG 2.2 AA standards.
- `pnpm verify:tokens`: Validates theme tokens across components.
- `pnpm verify:responsive`: Ensures viewport responsiveness across mobile, tablet, and desktop breakpoints.
