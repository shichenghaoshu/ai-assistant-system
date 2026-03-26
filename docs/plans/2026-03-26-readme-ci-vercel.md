# Repository Presentation and Preview Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a formal repository README, a GitHub Actions CI workflow, and a Vercel preview deployment path for the recreated frontend project.

**Architecture:** Keep repository metadata and automation minimal. `README.md` will document the current project honestly, GitHub Actions will run local-equivalent quality gates without secrets, and Vercel will own preview hosting through its native preview deployment flow.

**Tech Stack:** Markdown, GitHub Actions, Node.js, npm, Vite, Vercel CLI via `npx`.

---

### Task 1: Document the project clearly in `README.md`

**Files:**
- Create: `/Users/admin/Desktop/逆向/README.md`
- Reference: `/Users/admin/Desktop/逆向/package.json`
- Reference: `/Users/admin/Desktop/逆向/docs/plans/2026-03-25-jh-ttxue-online-route-inventory.md`

**Step 1: Write the failing documentation check**

Run: `test -f /Users/admin/Desktop/逆向/README.md`
Expected: command exits non-zero because the repository does not have a README yet.

**Step 2: Write the README**

Include:

```md
# AI Assistant System Frontend Recreation

## Overview
## Features
## Tech Stack
## Getting Started
## Environment Variables
## Scripts
## Testing and CI
## Deployment
```

Keep all setup and deployment notes aligned to the actual package scripts and current repo behavior.

**Step 3: Verify the README exists**

Run: `sed -n '1,220p' /Users/admin/Desktop/逆向/README.md`
Expected: the file renders the expected sections and does not contain secrets.

### Task 2: Add a secret-free GitHub Actions CI workflow

**Files:**
- Create: `/Users/admin/Desktop/逆向/.github/workflows/ci.yml`
- Reference: `/Users/admin/Desktop/逆向/package.json`

**Step 1: Write the failing workflow check**

Run: `test -f /Users/admin/Desktop/逆向/.github/workflows/ci.yml`
Expected: command exits non-zero because the workflow does not exist yet.

**Step 2: Implement the workflow**

Create a workflow with:

```yaml
name: CI
on:
  push:
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run build
```

Add npm caching and pin the Node major version explicitly.

**Step 3: Validate workflow shape**

Run: `sed -n '1,220p' /Users/admin/Desktop/逆向/.github/workflows/ci.yml`
Expected: push/PR triggers and the quality steps are visible.

### Task 3: Prepare the repository for Vercel previews

**Files:**
- Create or Skip: `/Users/admin/Desktop/逆向/vercel.json`
- Modify: `/Users/admin/Desktop/逆向/README.md`

**Step 1: Inspect whether explicit Vercel config is needed**

Run: `npx vercel --version`
Expected: the CLI resolves through `npx` even though no global `vercel` command is installed.

**Step 2: Add minimal config only if it improves determinism**

If needed, use:

```json
{
  "framework": "vite"
}
```

Do not add secrets or duplicate Vite defaults unnecessarily.

**Step 3: Document the preview workflow**

Add a short README section that distinguishes:

- local preview via `npm run preview`
- hosted preview via Vercel
- automatic preview generation after pushes once the GitHub repo is linked/imported in Vercel

### Task 4: Verify locally, deploy a preview, and publish the changes

**Files:**
- Modify: `/Users/admin/Desktop/逆向/README.md`
- Create or Modify: `/Users/admin/Desktop/逆向/.vercel/` (local link metadata only if generated; do not force-add tracked secrets)

**Step 1: Run the repository checks**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands pass, with only the existing large chunk warning allowed during build.

**Step 2: Create a Vercel preview deployment**

Run:

```bash
npx vercel deploy /Users/admin/Desktop/逆向 -y
```

Expected: Vercel returns a preview URL or stops at a clear authentication/import prompt that can be reported accurately.

**Step 3: Commit and push**

Run:

```bash
git add README.md .github/workflows/ci.yml vercel.json docs/plans/2026-03-26-readme-ci-vercel-design.md docs/plans/2026-03-26-readme-ci-vercel.md
git commit -m "chore: add project docs and preview automation"
git push origin main
```

Expected: GitHub reflects the documentation and CI changes, and the repo is ready for Vercel previews.
