# AI Assistant System Frontend Recreation

React + Vite recreation of the authorized `jh.ttxue.online` study-management frontend. The project mirrors the audited route tree, keeps the original information architecture, and prefers real Supabase-backed auth plus upstream API flows instead of mock data.

## Status

- All audited top-level routes are implemented in the local app shell.
- The app uses real Supabase authentication and real upstream data flows where the browser/runtime contract allows it.
- Route coverage includes auth, dashboard, plans, habits, rewards, exams, weakness analysis, settings, users, membership, redeem, export, import, and install guidance pages.
- Local quality checks are enforced through Vitest, ESLint, and Vite build validation.
- Preview hosting is designed for Vercel, with Git-based preview deployments after the repository is linked/imported in Vercel.

## Tech Stack

- React 19
- Vite 8
- React Router 7
- Supabase JS
- Vitest + Testing Library
- ESLint

## Getting Started

### Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- Access to the upstream Supabase project and API origin used by the recreated frontend

### Install

```bash
npm ci
```

### Configure environment variables

Create a local `.env.local` file from `.env.example` and fill in the live values you use for development.

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_TARGET_ORIGIN` | Recommended | Upstream site origin used by the local Vite dev proxy for `/api/*` requests, for example `https://jh.ttxue.online`. |
| `VITE_LOGIN_PATH` | Optional | Reserved for parity/debugging workflows. The current runtime does not require it. |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL used by the browser client. |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key used by the browser client. |

Do not commit `.env.local`. It is intentionally ignored by git.

### Run locally

```bash
npm run dev
```

The Vite dev server uses `vite.config.js` to proxy local `/api/*` calls to `VITE_TARGET_ORIGIN` when that value is set.

## Available Scripts

- `npm run dev` starts the local Vite development server.
- `npm run test` runs the Vitest suite once.
- `npm run lint` runs ESLint across the repository.
- `npm run build` creates a production bundle in `dist/`.
- `npm run preview` serves the built bundle locally.

## Project Structure

```text
src/
  auth/        Supabase session handling and login flows
  features/    Route-level data modules grouped by domain
  layout/      Shared authenticated shell
  pages/       Page components and page tests
  routes/      Audited route metadata and navigation grouping
  styles/      Shared CSS
  test/        Test setup
docs/plans/    Design, audit, and execution documents
```

## Testing and CI

Local verification matches the repository CI workflow:

```bash
npm test
npm run lint
npm run build
```

GitHub Actions runs the same commands on every push and pull request. The workflow is intentionally secret-free so repository health checks do not depend on deployment credentials.

## Deployment

### Local production-like preview

```bash
npm run build
npm run preview
```

### Vercel Preview

The repository is prepared for Vercel preview deployments.

- Import or link the GitHub repository in Vercel.
- Add the same `VITE_*` environment variables from your local `.env.local` into the Vercel project settings for the `Preview` environment.
- Push to GitHub after the repo is connected to Vercel. Vercel Git Integration will create a new preview deployment automatically.

For a one-off manual preview from the terminal, use:

```bash
npx vercel deploy . -y
```

The committed `vercel.json` keeps Vite builds deterministic, forwards `/api/*` requests to the upstream site, and preserves client-side routing for deep links.

## Operational Notes

- Preview deployments are not mock sandboxes. When preview environment variables point at the real backend, the deployed app talks to live Supabase data and upstream API routes.
- GitHub Actions validates repository quality only. It does not deploy or store deployment tokens.
- If a preview builds successfully but login or API features fail, check Vercel environment variables first.

## Reference Docs

- [Authorized recreation design](docs/plans/2026-03-25-jh-ttxue-online-design.md)
- [Route inventory](docs/plans/2026-03-25-jh-ttxue-online-route-inventory.md)
- [README/CI/Vercel design](docs/plans/2026-03-26-readme-ci-vercel-design.md)
