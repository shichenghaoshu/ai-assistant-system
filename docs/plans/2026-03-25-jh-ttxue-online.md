# jh.ttxue.online Recreation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a new React + Vite project that recreates the full reachable frontend of `https://jh.ttxue.online/` and prefers real authenticated API flows wherever the local browser environment supports them.

**Architecture:** Start with a disciplined audit pass to inventory the authenticated route tree, visible states, and network contracts. Then bootstrap a fresh Vite app, implement the shared shell and auth/request layer, add feature modules in audited priority order, and verify parity route by route against the original site.

**Tech Stack:** React, Vite, React Router, plain CSS or repo-native styling, Playwright for audit capture, browser devtools/network inspection, local `.env.local` configuration, Vitest where unit coverage is practical.

---

### Task 1: Prepare the workspace and secret handling

**Files:**
- Create: `/Users/admin/Desktop/逆向/.gitignore`
- Create: `/Users/admin/Desktop/逆向/.env.example`
- Create: `/Users/admin/Desktop/逆向/.env.local`
- Modify: `/Users/admin/Desktop/逆向/docs/plans/2026-03-25-jh-ttxue-online-design.md`

**Step 1: Write the failing safety check**

Create `.gitignore` entries that explicitly exclude runtime secrets and local captures:

```gitignore
.env.local
playwright/.auth/
captures/
```

**Step 2: Verify the safety baseline**

Run: `test ! -f /Users/admin/Desktop/逆向/.env.local && echo "no local env yet"`
Expected: `no local env yet`

**Step 3: Write minimal runtime env templates**

Create `.env.example` with placeholder keys only:

```dotenv
VITE_TARGET_ORIGIN=
VITE_LOGIN_PATH=
```

Create `.env.local` with the real origin and login path only after the audit reveals them.

**Step 4: Verify files exist and secrets stay local**

Run: `ls -la /Users/admin/Desktop/逆向/.gitignore /Users/admin/Desktop/逆向/.env.example`
Expected: both files exist, `.env.local` stays local and untracked.

### Task 2: Audit the live site structure before coding

**Files:**
- Create: `/Users/admin/Desktop/逆向/docs/plans/2026-03-25-jh-ttxue-online-route-inventory.md`
- Create: `/Users/admin/Desktop/逆向/captures/`
- Create: `/Users/admin/Desktop/逆向/captures/network/`
- Create: `/Users/admin/Desktop/逆向/captures/screens/`

**Step 1: Log in and enumerate the top-level app shell**

Use Playwright to:

```js
async (page) => {
  await page.goto('https://jh.ttxue.online/');
}
```

Expected: the login screen or authenticated redirect is visible.

**Step 2: Capture the reachable route tree**

Record for each route:

```markdown
| Route | Entry point | Secondary tabs | Table/filter states | Modal/drawer states | Notes |
| --- | --- | --- | --- | --- | --- |
```

**Step 3: Capture network contracts**

For each audited route, record:

```markdown
- method
- URL pattern
- auth mechanism
- query params
- request body shape
- response keys used by the UI
```

**Step 4: Verify audit coverage before scaffolding**

Run: compare the inventory against the global nav and confirm each reachable section has at least one entry.
Expected: no primary nav item remains undocumented.

### Task 3: Bootstrap the new React + Vite app

**Files:**
- Create: `/Users/admin/Desktop/逆向/package.json`
- Create: `/Users/admin/Desktop/逆向/vite.config.js` or `/Users/admin/Desktop/逆向/vite.config.ts`
- Create: `/Users/admin/Desktop/逆向/index.html`
- Create: `/Users/admin/Desktop/逆向/src/main.jsx`
- Create: `/Users/admin/Desktop/逆向/src/App.jsx`
- Create: `/Users/admin/Desktop/逆向/src/styles/`

**Step 1: Write the failing bootstrap command**

Run: `test -f /Users/admin/Desktop/逆向/package.json`
Expected: command exits non-zero because the app does not exist yet.

**Step 2: Generate the app**

Run the bootstrap script or equivalent Vite initializer so the output lives directly in `/Users/admin/Desktop/逆向`.

**Step 3: Add the minimal app mount**

Ensure `src/main.jsx` mounts the app:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Step 4: Verify the scaffold**

Run: `npm install && npm run build`
Expected: Vite builds successfully with the default shell.

### Task 4: Add routing, app shell, and layout primitives

**Files:**
- Create: `/Users/admin/Desktop/逆向/src/router.jsx`
- Create: `/Users/admin/Desktop/逆向/src/layout/AppShell.jsx`
- Create: `/Users/admin/Desktop/逆向/src/layout/Sidebar.jsx`
- Create: `/Users/admin/Desktop/逆向/src/layout/Topbar.jsx`
- Modify: `/Users/admin/Desktop/逆向/src/App.jsx`
- Create: `/Users/admin/Desktop/逆向/src/styles/layout.css`

**Step 1: Write the failing route shell test or smoke check**

Run: `npm run build`
Expected: build still passes, but no audited route structure exists yet.

**Step 2: Implement the minimal router structure**

Use an audited placeholder tree like:

```jsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
    ],
  },
])
```

**Step 3: Build the shell components**

Render:
- left navigation
- top header
- main content outlet

with styles sized to match the audited app shell before feature detail work.

**Step 4: Verify visual shell stability**

Run: `npm run dev`
Expected: the local shell renders and can accept audited routes without layout shifts.

### Task 5: Implement auth/session handling against the real site

**Files:**
- Create: `/Users/admin/Desktop/逆向/src/auth/session.js`
- Create: `/Users/admin/Desktop/逆向/src/auth/LoginPage.jsx`
- Create: `/Users/admin/Desktop/逆向/src/auth/AuthGate.jsx`
- Modify: `/Users/admin/Desktop/逆向/src/router.jsx`
- Modify: `/Users/admin/Desktop/逆向/vite.config.*`

**Step 1: Write the failing auth flow check**

Document the real login request shape from the audit and try it through the local proxy.

Run: local login request through the browser or a small fetch wrapper.
Expected: unauthorized or proxy failure until the request layer is configured correctly.

**Step 2: Implement the proxy and request preservation**

Add a Vite proxy similar to:

```js
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_TARGET_ORIGIN,
      changeOrigin: true,
      secure: false,
    },
  },
}
```

Adjust the path only after the audit confirms the real prefixes.

**Step 3: Implement the login screen and session gate**

Recreate the original login UI and preserve the real auth request, cookies, redirects, and guarded route behavior.

**Step 4: Verify authenticated navigation**

Run: `npm run dev`
Expected: successful local login or a clearly identified browser/auth blocker with exact symptoms documented.

### Task 6: Build the audited feature modules in priority order

**Files:**
- Create: `/Users/admin/Desktop/逆向/src/features/<feature>/`
- Create: `/Users/admin/Desktop/逆向/src/pages/`
- Modify: `/Users/admin/Desktop/逆向/src/router.jsx`

**Step 1: Write the failing route stub**

For the highest-priority audited route, add a placeholder component and note missing data bindings.

**Step 2: Implement the route shell**

Match:
- section title
- card/table/form structure
- filters
- buttons
- pagination chrome

before wiring response data.

**Step 3: Wire the real request contract**

Create a feature request module like:

```js
export async function fetchFeatureList(params) {
  return request('/real/path', { method: 'GET', params })
}
```

Bind only the response keys confirmed by the audit.

**Step 4: Verify the route against production**

Compare local and live views side by side at the same viewport.
Expected: layout and data shape match closely enough to move to the next route.

### Task 7: Add tables, filters, forms, and overlay states

**Files:**
- Modify: `/Users/admin/Desktop/逆向/src/features/<feature>/*.jsx`
- Create: `/Users/admin/Desktop/逆向/src/components/`
- Create: `/Users/admin/Desktop/逆向/src/styles/components.css`

**Step 1: Write the failing state checklist**

For each audited feature, list missing states:

```markdown
- loading
- empty
- validation error
- success
- disabled
- expanded/collapsed
- modal open/close
```

**Step 2: Implement the minimal missing states**

Only add states that were observed in the live UI or are necessary for honest request handling.

**Step 3: Implement write-action flows carefully**

Before enabling a mutation button, confirm:
- endpoint
- required payload
- success response
- error response
- visible side effects

Then wire the action through the same centralized request layer.

**Step 4: Verify no blind mutations remain**

Run through every enabled write action in the recreated UI and confirm the request contract matches the audited behavior.

### Task 8: Centralize requests and error handling

**Files:**
- Create: `/Users/admin/Desktop/逆向/src/lib/request.js`
- Create: `/Users/admin/Desktop/逆向/src/lib/querystring.js`
- Modify: feature request modules under `/Users/admin/Desktop/逆向/src/features/`

**Step 1: Write the failing duplication check**

Search for raw `fetch(` or `axios(` calls spread across feature components.

Run: `rg "fetch\\(|axios\\(" /Users/admin/Desktop/逆向/src`
Expected: duplicates exist before consolidation.

**Step 2: Implement a minimal shared request wrapper**

Start with:

```js
export async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return response.json()
}
```

Refine only when the audited API format requires it.

**Step 3: Migrate feature calls**

Replace route-level request code with thin feature-specific wrappers.

**Step 4: Verify request consistency**

Run the audited flows again and confirm auth/cookie behavior still works after consolidation.

### Task 9: Match styling, responsive behavior, and motion

**Files:**
- Modify: `/Users/admin/Desktop/逆向/src/styles/*.css`
- Modify: `/Users/admin/Desktop/逆向/src/layout/*.jsx`
- Modify: `/Users/admin/Desktop/逆向/src/features/**/*.jsx`

**Step 1: Write the failing parity checklist**

For each audited route, compare:
- typography
- spacing
- color
- borders/radii
- shadows
- hover/active timing

and record the biggest deltas first.

**Step 2: Fix the largest visual mismatches**

Address layout and typography before color micro-tuning.

**Step 3: Add responsive adjustments**

Mirror the live desktop and mobile breakpoints observed during the audit.

**Step 4: Verify side-by-side parity**

Expected: no major shell, typography, spacing, or route-structure mismatches remain on audited pages.

### Task 10: Document blockers and operator instructions

**Files:**
- Modify: `/Users/admin/Desktop/逆向/docs/plans/2026-03-25-jh-ttxue-online-route-inventory.md`
- Create: `/Users/admin/Desktop/逆向/README.md`

**Step 1: Write the failing operator checklist**

List what a new operator would need:
- install
- env setup
- dev command
- build command
- known blockers

**Step 2: Write the minimal README**

Include:

```md
# jh.ttxue.online recreation

## Local development
- `npm install`
- `npm run dev`

## Runtime configuration
- copy `.env.example` to `.env.local`
- set upstream origin values locally

## Known gaps
- document any browser/auth/protected-flow blockers here
```

**Step 3: Final verification**

Run: `npm run build`
Expected: production build succeeds after all documented routes and integrations are in place.

**Step 4: Close the audit loop**

Confirm every primary nav item and reachable nested state from the route inventory is either:
- implemented,
- intentionally blocked with a documented reason, or
- proven unreachable from the authorized account.
