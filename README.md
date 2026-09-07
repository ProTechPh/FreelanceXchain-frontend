<!-- markdownlint-disable-next-line MD041 -->
<div align="center">

# 🌐 FreelanceXchain Frontend

**Blockchain-Based Freelance Marketplace with AI Skill Matching**

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue.svg)](https://www.typescriptlang.org)

The frontend for a decentralized freelance marketplace where employers post projects, freelancers get matched by AI and hired on-chain, and payments are held in smart-contract escrow and released milestone-by-milestone.

</div>

---

## 📖 What is this?

FreelanceXchain Frontend is a **Next.js 16 application** (React 19 + TypeScript) for the user-facing side of a freelance marketplace built on:

1. **Appwrite** — users, profiles, projects, and data persistence
2. **Ethereum smart contracts** — escrow, agreements, disputes, and reputation (Polygon Amoy)
3. **LLM-powered AI matching** — skill extraction and project↔freelancer recommendations

**Who it's for:** freelancers who want guaranteed, on-time payment; employers who want vetted, well-matched talent; and anyone tired of platforms that take a cut of every payment.

## 🔄 How it works

```
Employer browses dashboard  →  Creates project with milestones
        ↓
AI matches freelancers  →  Freelancer submits proposal
        ↓
Employer reviews & accepts  →  Smart contract created & escrow funded
        ↓
Freelancer submits work  →  Employer approves milestone
        ↓
Payment released from escrow  →  Both parties rate each other (on-chain)
```

## ✨ Key features

| Feature | Description |
| --- | --- |
| 🔐 **Decentralized Auth** | Appwrite session JWTs, MFA, OAuth, role-based access |
| 💰 **Smart Contract Escrow** | Milestone-based payment release via Ethereum contracts |
| 🤖 **AI Matching** | LLM-powered skill extraction & project recommendations |
| 👤 **KYC Verification** | Didit identity verification (220+ countries) |
| ⭐ **On-chain Reputation** | Immutable ratings stored in smart contracts |
| 📊 **Dashboard Analytics** | Real-time project metrics and freelancer insights |
| 💬 **Messaging** | Real-time notifications with SSE streaming |
| 🎨 **Modern UI** | shadcn/ui components with Tailwind CSS v4 |

## 🚀 Tech Stack

| Layer | Technology |
| --- | --- |
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, shadcn/ui (base-nova) |
| **State Management** | Zustand (persisted stores), TanStack Query |
| **Blockchain** | Ethers.js v6, Polygon Amoy testnet |
| **API Client** | Axios with CSRF protection |
| **Animation** | Motion (Framer Motion), Embla Carousel |
| **Testing** | Node.js test runner (unit), Playwright (E2E) |
| **Package Manager** | pnpm (workspaces) |

## 📦 Getting Started

### Prerequisites

- **Node.js** 22+ and **pnpm** 11+
- Backend API running ([FreelanceXchain-api](https://github.com/ProTechPh/FreelanceXchain-api))
- Ganache node or Polygon Amoy wallet (for blockchain features)

### Quick Setup

```bash
# 1. Clone & install
git clone https://github.com/ProTechPh/FreelanceXchain-frontend.git
cd FreelanceXchain-frontend
pnpm install --frozen-lockfile

# 2. Configure environment
cp .env.local.example .env.local
# At minimum: NEXT_PUBLIC_API_URL

# 3. Run the dev server
pnpm dev
```

The app listens on **http://localhost:3000** by default.

### Docker

```bash
docker build -t freelancexchain-frontend:latest .
docker run -p 3000:3000 freelancexchain-frontend:latest
```

## 🔑 Environment Variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend API URL (**required**, e.g., `http://localhost:3001/api`) |
| `NEXT_PUBLIC_GANACHE_*_ADDRESS` | Smart contract addresses for local development |
| `NEXT_DIST_DIR` | Custom build output directory (used by E2E tests) |

## 📜 Available Commands

| Purpose | Command |
| --- | --- |
| Install dependencies | `pnpm install --frozen-lockfile` |
| Dev server | `pnpm dev` |
| Production build | `pnpm build` |
| Start production | `pnpm start` |
| Lint | `pnpm run lint` |
| Type check | `pnpm run typecheck` |
| Unit tests | `pnpm test` |
| E2E tests | `pnpm run test:e2e` |
| Contract tests | `pnpm run test:auth`, `test:csrf`, etc. |
| Verify design tokens | `pnpm run verify` (contrast, tokens, responsive) |

## 🗂️ Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth-related pages (login, register)
│   │   ├── dashboard/          # Role-based dashboards
│   │   ├── projects/           # Project listing and details
│   │   ├── freelancers/        # Freelancer profiles
│   │   ├── employers/          # Employer profiles
│   │   ├── api/                # Next.js API routes
│   │   └── ...                 # Marketing pages (about, contact, etc.)
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui primitives (29 components)
│   │   ├── auth/               # Authentication components
│   │   ├── contracts/          # Smart contract interaction
│   │   ├── dashboard/          # Dashboard-specific components
│   │   ├── layout/             # Layout shells & navigation
│   │   ├── marketplace/        # Marketplace components
│   │   ├── payments/           # Payment UI
│   │   ├── projects/           # Project components
│   │   ├── wallet/             # Wallet connection UI
│   │   └── ...                 # Feature-specific components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities, API client, contracts
│   ├── stores/                 # Zustand stores (auth, tour)
│   └── types/                  # TypeScript type definitions
├── e2e/                        # Playwright E2E tests (26 specs)
├── scripts/                    # Build and verification scripts
├── public/                     # Static assets
├── docs/                       # Documentation
└── .github/workflows/          # CI/CD workflows
```

## 🧪 Testing & Quality

```bash
pnpm test              # Unit and contract tests
pnpm run test:e2e      # Playwright browser tests
pnpm run typecheck     # TypeScript type check
pnpm run lint          # ESLint
pnpm run verify        # Verify contrast, tokens, responsive
pnpm run build         # Production build
```

### E2E Testing

Playwright tests run against a dedicated server at `http://127.0.0.1:3100` with a separate `.next-e2e/` build directory to avoid conflicts with the main dev server. Tests cover:

- Authentication flows (OAuth, login, recovery)
- Dashboard navigation (freelancer, employer, admin)
- Marketplace search and filtering
- Contract negotiation workflow
- Milestone payments & escrow
- Dispute evidence submission
- Profile editing
- Responsive layouts (320px - desktop)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                        │
│   Pages → Server Components → Client Components              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    State Management                          │
│   Zustand (auth, onboarding) + TanStack Query (server state) │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Backend API    │ │  Smart Contracts  │ │   Appwrite       │
│  (Axios + CSRF)  │ │   (Ethers.js)    │ │  (Auth/Storage)  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

## 🎨 Design System

- **shadcn/ui** — base-nova style with custom theming
- **Tailwind CSS v4** — CSS-first configuration, semantic tokens
- **Lucide** — icon library
- **Motion** — animation library
- **WCAG 2.2 AA** — verified contrast ratios (4.5:1 text, 3:1 UI)

Typography uses **Nunito Sans** with a scale anchored at 16px base. Design tokens are defined in `globals.css` and verified by `pnpm run verify`.

## 📚 Documentation

| Topic | Link |
| --- | --- |
| Backend API | [FreelanceXchain-api](https://github.com/ProTechPh/FreelanceXchain-api) |
| Backend README | [Backend README.md](../FreelanceXchain-api/README.md) |
| Security Policy | [SECURITY.md](SECURITY.md) |

## 🤝 Contributing

We welcome contributions! Please read the guidelines before submitting a PR:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Ensure CI passes: `lint` → `typecheck` → `test` → `test:e2e` → `build`.

## 📜 License

This project is licensed under the [ISC License](LICENSE).

## 🆘 Support

- **Bug Reports & Feature Requests:** [GitHub Issues](https://github.com/ProTechPh/FreelanceXchain-frontend/issues)
- **Security Issues:** See [SECURITY.md](SECURITY.md) for responsible disclosure
