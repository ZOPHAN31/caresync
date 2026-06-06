# CareSync

CareSync is a comprehensive family caregiving platform that brings care logs, medication tracking, family coordination, documents, and AI-powered planning into one place. It is built as a TypeScript monorepo with a Next.js 14 frontend and an Express API backed by PostgreSQL and Redis. This repository is the monorepo foundation — feature domains are layered on in subsequent phases.

## Tech Stack

| Layer        | Technology                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui, React Query, Zustand, react-hook-form + Zod |
| **Backend**  | Node.js, Express, Zod, Winston, JWT (`jsonwebtoken`), Helmet, Prisma client                             |
| **Database** | PostgreSQL 16, Redis (via `ioredis`)                                                                    |
| **AI**       | Anthropic Claude (wired in a later phase via `ANTHROPIC_API_KEY`)                                       |
| **DevOps**   | pnpm workspaces, Turborepo, Docker Compose, Husky, commitlint, ESLint, Prettier                         |

## Prerequisites

- **Node.js 20+**
- **pnpm 8+** (`npm install -g pnpm` or `corepack enable pnpm`)
- **Docker Desktop** (for local PostgreSQL + Redis)

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/caresync.git
   cd caresync
   ```
2. **Install dependencies**
   ```bash
   pnpm install
   ```
3. **Copy environment variables**
   ```bash
   cp .env.example .env
   # The API reads apps/api/.env — copy there too for local dev:
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```
   Set `DATABASE_URL`, `REDIS_URL`, and a `JWT_SECRET` of at least 32 characters.
4. **Start infrastructure (PostgreSQL + Redis)**
   ```bash
   pnpm docker:up
   ```
5. **Run the apps**
   ```bash
   pnpm dev
   ```

   - Web: http://localhost:3000
   - API: http://localhost:3001/api/v1/health

## Available Scripts

| Script               | Description                             |
| -------------------- | --------------------------------------- |
| `pnpm dev`           | Run all apps in development (Turborepo) |
| `pnpm build`         | Build all apps and packages             |
| `pnpm lint`          | Lint every workspace                    |
| `pnpm lint:fix`      | Lint and auto-fix                       |
| `pnpm type-check`    | Type-check every workspace              |
| `pnpm test`          | Run all tests                           |
| `pnpm test:coverage` | Run tests with coverage                 |
| `pnpm format`        | Format the repo with Prettier           |
| `pnpm format:check`  | Verify formatting                       |
| `pnpm docker:up`     | Start PostgreSQL + Redis containers     |
| `pnpm docker:down`   | Stop containers                         |
| `pnpm docker:reset`  | Recreate containers with fresh volumes  |

## Project Structure

```
caresync/
├── apps/
│   ├── web/          # Next.js 14 frontend (App Router, Tailwind, shadcn/ui)
│   └── api/          # Express backend (TypeScript)
├── packages/
│   ├── types/        # Shared TypeScript type definitions (@caresync/types)
│   ├── utils/        # Shared utility functions (@caresync/utils)
│   └── config/
│       ├── eslint/   # Shared ESLint config (@caresync/eslint-config)
│       └── tsconfig/ # Shared TypeScript configs (@caresync/tsconfig)
├── docker/
│   └── postgres/     # DB init scripts
├── scripts/          # Operational scripts (smoke test, etc.)
└── .github/          # CI/CD workflows
```

## Environment Variables

| Variable              | Required | Description                                |
| --------------------- | -------- | ------------------------------------------ |
| `NODE_ENV`            | no       | `development` \| `test` \| `production`    |
| `PORT`                | no       | API port (default `3001`)                  |
| `DATABASE_URL`        | yes      | PostgreSQL connection string               |
| `REDIS_URL`           | yes      | Redis connection string                    |
| `JWT_SECRET`          | yes      | JWT signing secret (≥ 32 characters)       |
| `JWT_EXPIRES_IN`      | no       | Token lifetime (default `7d`)              |
| `ALLOWED_ORIGINS`     | no       | Comma-separated CORS origins               |
| `NEXT_PUBLIC_API_URL` | no       | API base URL used by the web client        |
| `ANTHROPIC_API_KEY`   | no       | Anthropic Claude API key (later phase)     |
| `RESEND_API_KEY`      | no       | Transactional email (later phase)          |
| `STRIPE_SECRET_KEY`   | no       | Billing (later phase)                      |
| `TWILIO_*`            | no       | SMS notifications (later phase)            |
| `R2_*`                | no       | Object storage for documents (later phase) |

## Contributing

- **Commit convention:** [Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint via a Husky `commit-msg` hook. Allowed types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`.
  ```
  feat: add medication reminder scheduler
  fix(api): handle missing JWT secret on startup
  ```
- **Branch naming:** prefix branches by change type — `feat/`, `fix/`, `chore/` (e.g. `feat/care-log-timeline`).
- **Before pushing:** a Husky `pre-commit` hook runs `lint-staged` (ESLint + Prettier). Run `pnpm lint` and `pnpm type-check` locally to catch issues early.

---

© 2025 CareSync
