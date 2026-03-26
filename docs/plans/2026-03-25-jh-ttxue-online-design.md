# jh.ttxue.online Frontend Recreation Design

**Date:** 2026-03-25

**Target:** `https://jh.ttxue.online/`

**Goal**

Recreate the full reachable frontend of the authorized site in a new React + Vite project under `/Users/admin/Desktop/逆向`, with the local app prioritizing real authenticated requests and real data flow wherever the browser environment allows it.

**Scope**

- Cover the authenticated app shell and every reachable page, nested tab, modal, drawer, table state, pagination path, and write-action entry that is visible after login.
- Preserve the original information architecture, copy, layout, navigation hierarchy, typography, spacing, colors, borders, shadows, and interaction timing as closely as practical.
- Use the provided credentials only for local auditing and runtime login, never in tracked source files or generated documentation.
- Prefer real online APIs over local mocks. If a workflow is blocked by browser-only protections, opaque signatures, restricted uploads, or unstable cross-origin behavior, record the limitation explicitly instead of fabricating unsupported production behavior.

**Non-Goals**

- Redesigning the product or introducing a new visual system.
- Replacing the backend, reverse engineering protected server logic, or bypassing access controls.
- Claiming full parity without route-by-route and state-by-state verification.

**Authorized Constraints**

- The user confirmed ownership or explicit authorization to access and recreate the site frontend.
- The user allowed inspection of write-action flows, but write requests still need to be understood before being replayed locally to avoid blind mutations.
- Credentials must remain local and untracked.

## Architecture

The output will be a new React + Vite application that mirrors the target site's route hierarchy and reusable UI primitives. The app will be organized around a shared shell, a centralized request layer, and feature modules for each major navigation group. Authentication and API requests will prefer the real upstream service, typically through a local Vite proxy or same-origin forwarding strategy that reduces CORS friction while preserving request semantics.

The implementation stays static-first only at the component structure level, not at the data level. That means the local app can render stable shells immediately, but page data, pagination, filters, and mutations should be wired to real interfaces as soon as the request contracts are known. Where true parity depends on hidden tokens, client signatures, or upload transports that cannot be reproduced from the browser capture, the recreated frontend will stop at the last honest boundary and document the gap.

## Audit Strategy

Before writing application code, the site will be audited systematically:

1. Log in with the provided credentials.
2. Traverse global navigation and note the authenticated landing route.
3. Visit each primary section, then each secondary tab, accordion, drawer, modal, and pagination branch.
4. Capture visible copy, labels, actions, and repeated layout patterns.
5. Record network activity per route to identify HTML entry points, JS bundles, API endpoints, auth headers, cookies, and mutation flows.
6. Build a route and state coverage matrix for implementation tracking.

The audit must separate:

- Purely presentational routes that can be rebuilt directly.
- Data-backed routes that can be called from the local app.
- Flows that appear reachable but require special anti-automation or signature behavior.

## Implementation Approach

The recreation will proceed in this order:

1. Bootstrap the new React + Vite project and local development structure.
2. Build the shared shell, routing, and authenticated layout.
3. Recreate the login flow and session persistence strategy.
4. Implement the highest-traffic authenticated landing pages first.
5. Add secondary modules, nested tabs, table states, filters, and modals.
6. Wire real API calls through a centralized client layer.
7. Revisit each route for styling parity, responsive behavior, and interaction polish.

Each feature area will use shared primitives only after parity is proven, not before. The priority is matching the original UI and behavior; refactoring comes second.

## Data and Auth Strategy

- Store secrets only in local untracked runtime configuration such as `.env.local`.
- Keep `.env.example` limited to placeholder variable names and leave `.env.local` absent until the live audit reveals the real origin and login path.
- Keep request wrappers centralized so auth headers, cookies, base URLs, and error handling can be adjusted in one place.
- Reuse real login/session behavior where possible instead of inventing a parallel local auth model.
- Treat write actions carefully: inspect request shape, required fields, validation, and side effects before invoking them from the recreated UI.

## Verification Strategy

Parity is validated route by route:

- Compare the local app and original site side by side at matching desktop and mobile widths.
- Verify page regions, navigation states, typography, spacing, table structure, forms, overlays, and action affordances before micro-tuning visual polish.
- Confirm meaningful states including loading, empty, disabled, validation, success, error, expanded, and collapsed when reachable.
- Document blocked or partially recreated features explicitly.

## Deliverables

- A runnable React + Vite project in `/Users/admin/Desktop/逆向`.
- A route/state inventory covering the reachable authenticated UI.
- A centralized API/auth integration layer that prefers real upstream requests.
- A gap list for features blocked by private mechanisms or browser limitations.

## Risks and Mitigations

- **CORS or cookie scoping issues:** mitigate with local proxying and browser-side request inspection before changing the frontend architecture.
- **Opaque auth or request signing:** identify the exact boundary during audit and document it rather than faking support.
- **Large reachable surface area:** maintain a route/state checklist and implement highest-traffic modules first.
- **Accidental write-side effects:** inspect mutations before replaying them; do not trigger blind submissions from the local app.
