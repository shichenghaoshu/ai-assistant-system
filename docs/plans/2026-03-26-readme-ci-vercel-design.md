# Repository Presentation and Preview Deployment Design

**Date:** 2026-03-26

**Goal**

Turn the recreated frontend repo into a project that is presentable to collaborators and easy to validate in the cloud by adding a formal `README.md`, a reliable GitHub Actions CI workflow, and a Vercel preview deployment path that can power automatic preview builds after pushes.

**Scope**

- Write a repository-level `README.md` that explains what the project is, how to run it, how to test it, what environment variables matter, and what the current deployment model is.
- Add GitHub Actions so pushes and pull requests run the same core checks used locally: install, test, lint, and build.
- Prepare the project for Vercel preview deployments and create at least one preview deployment from the current branch.
- Favor Vercel Git Integration for ongoing preview deployments after pushes instead of storing long-lived deployment secrets in GitHub Actions.

**Non-Goals**

- Reworking the app architecture or changing product behavior.
- Adding a production deployment pipeline.
- Introducing secret-bearing CI steps or committing live credentials.

## Chosen Approach

The repository will use a split delivery model:

1. `README.md` becomes the source of truth for local development, verification, and deployment expectations.
2. GitHub Actions handles repository health only. It will run on push and pull request, restore npm cache, and execute `npm ci`, `npm test`, `npm run lint`, and `npm run build`.
3. Vercel handles preview hosting through its own project/linking model. The repo will include only minimal deployment metadata needed for stable Vite builds, while preview creation and future auto-previews remain managed by Vercel rather than by GitHub secrets.

This keeps CI simple and auditable while still meeting the user's requirement that pushes lead to Vercel previews once the repo is linked/imported in Vercel.

## README Structure

The README should read like a maintained engineering project, not a scratchpad. It will include:

- project overview and purpose
- current feature/status summary
- tech stack
- local setup steps
- required environment variables and secret-handling guidance
- available npm scripts
- testing and CI notes
- deployment notes for Vercel previews
- repository structure at a high level

The README should be honest about the project's real-data orientation and the fact that some behaviors depend on external services and local credentials.

## CI Design

The GitHub Actions workflow will:

- trigger on pushes and pull requests
- run on `ubuntu-latest`
- use a current LTS-compatible Node version
- enable npm dependency caching
- install dependencies with `npm ci`
- run test, lint, and build as separate visible steps

The workflow should stay deterministic and secret-free. No deployment token, preview URL, or environment secret should be required for the CI job to pass.

## Vercel Design

The project already matches Vercel's default Vite expectations, so configuration should stay minimal. A small `vercel.json` is acceptable only if it clarifies framework/build behavior; otherwise the repo can rely on defaults.

Because the local machine does not currently have a global `vercel` binary, deployment should use `npx vercel`. The initial preview deployment proves the project builds on Vercel. Ongoing automatic previews after future pushes depend on the repo being linked/imported into a Vercel project. If the current Vercel account is already authenticated, the setup can be completed in-session; if not, the remaining blocker is account authentication rather than repository code.

## Verification

Success for this task means:

- `README.md` exists and matches the current project accurately.
- GitHub Actions workflow syntax is valid and the repo has the expected CI steps.
- local `npm test`, `npm run lint`, and `npm run build` still pass after the documentation/config changes.
- a Vercel preview deployment is created or the exact authentication/import blocker is captured precisely.

## Risks and Mitigations

- **Vercel auth missing locally:** use `npx vercel`; if login is still missing, stop at the exact auth boundary and report it clearly.
- **Git-based auto-preview not enabled yet:** document that Vercel Git Integration is the ongoing trigger mechanism after the one-time project link/import.
- **README drift:** keep the README grounded in actual scripts and current route/state coverage rather than aspirational claims.
