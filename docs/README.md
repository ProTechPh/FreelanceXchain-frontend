# FreelanceXchain Frontend Documentation

Welcome to the documentation for the FreelanceXchain web application.

FreelanceXchain is built on **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and integrates with **Ethers.js v6** and **Appwrite**.

---

## Documentation Index

| Guide | Description |
|---|---|
| [Architecture Overview](architecture.md) | Next.js App Router layout, route groups, role-based access, and design system primitives. |
| [State Management & Data Fetching](state-management.md) | Dual-tier state architecture: Zustand local persistence, TanStack React Query cache, and CSRF token handling. |
| [Web3 & Smart Contract Integration](web3-integration.md) | Ethers.js v6 wallet connectivity, Polygon Amoy & Ganache network switching, and Escrow ABI contracts. |
| [Backend-Frontend Coverage](backend-frontend-coverage.md) | Comprehensive audit of API contract coverage, status mappings, and canonical route alternatives. |

---

## Quick Reference

- **Development Server:** `pnpm dev`
- **Type Checking:** `pnpm typecheck`
- **Linting:** `pnpm lint`
- **Unit & Contract Tests:** `pnpm test`
- **End-to-End Tests:** `pnpm test:e2e`
- **Design System Verification:** `pnpm verify` (contrast, tokens, responsiveness)
