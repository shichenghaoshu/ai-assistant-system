# Frontend System Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the recreated app's shared visual language so the shell, dashboard, forms, tables, and feedback states feel like one deliberate study workspace instead of a generic glassmorphism admin UI.

**Architecture:** Push most of the redesign through shared tokens and reusable layout classes in `src/styles/layout.css`, then adjust the shell markup and dashboard composition so the new system has a strong first impression. Finish by tuning feature-level styles that lean on the shared primitives most heavily.

**Tech Stack:** React, Vite, plain CSS, React Router, Vitest, ESLint.

---

### Task 1: Upgrade global tokens and typography

**Files:**
- Modify: `/Users/admin/Desktop/逆向/src/styles/global.css`
- Modify: `/Users/admin/Desktop/逆向/src/styles/layout.css`

**Step 1: Write the failing shell snapshot expectation**

Review current shell classes and note that the app still depends on pale blue glass tokens:

```css
:root {
  --bg: #eef4ff;
  --surface: rgba(255, 255, 255, 0.82);
}
```

Expected: existing tokens do not support the new inky-rail plus paper-surface direction.

**Step 2: Implement the new token layer**

Add:

```css
:root {
  --bg-canvas: #f3efe6;
  --bg-paper: rgba(255, 251, 245, 0.88);
  --ink-900: #111827;
  --accent: #2f5cff;
}
```

Import the new type pairing in `global.css` and move shared body rendering to the new palette.

**Step 3: Verify the shared foundation**

Run: `npm run build`
Expected: the app still builds and shared styles compile cleanly.

### Task 2: Reshape the shell and navigation hierarchy

**Files:**
- Modify: `/Users/admin/Desktop/逆向/src/layout/AppShell.jsx`
- Modify: `/Users/admin/Desktop/逆向/src/layout/Sidebar.jsx`
- Modify: `/Users/admin/Desktop/逆向/src/layout/Topbar.jsx`
- Modify: `/Users/admin/Desktop/逆向/src/styles/layout.css`

**Step 1: Write the failing shell structure check**

Inspect the current shell and note the old hierarchy:

```jsx
<div className="app-shell">
  <Sidebar />
  <div className="shell-main">
    <Topbar />
    <main className="shell-content">
      <Outlet />
    </main>
  </div>
</div>
```

Expected: the markup lacks a dedicated backdrop layer and stronger workspace framing.

**Step 2: Implement the shell markup refinement**

Add a shell backdrop/wash layer, stronger sidebar brand structure, and a calmer topbar meta structure while keeping route behavior unchanged.

**Step 3: Implement the shell CSS**

Update:

```css
.app-shell { ... }
.sidebar { ... }
.topbar { ... }
.shell-content { ... }
```

so the sidebar becomes the anchor and the content area feels flatter, cleaner, and less card-dependent.

**Step 4: Verify the shell**

Run: `npm test`
Expected: route and shell tests still pass or only fail where markup needs intentional test updates.

### Task 3: Rebuild shared panels, fields, banners, and list/table styling

**Files:**
- Modify: `/Users/admin/Desktop/逆向/src/styles/layout.css`
- Modify: `/Users/admin/Desktop/逆向/src/styles/plans.css`
- Modify: `/Users/admin/Desktop/逆向/src/styles/settings.css`
- Modify: `/Users/admin/Desktop/逆向/src/styles/users.css`
- Reference: `/Users/admin/Desktop/逆向/src/styles/exams.css`
- Reference: `/Users/admin/Desktop/逆向/src/styles/system-tools.css`

**Step 1: Write the failing visual inventory**

List the old generic building blocks:

```css
.data-card
.metric-card
.field-input
.feedback-banner
.empty-state
```

Expected: they rely on the same rounded white card treatment and do not differentiate panel, row, and field behaviors enough.

**Step 2: Rewrite the shared primitives**

Implement:

```css
.data-card { ... }
.metric-card { ... }
.field-input { ... }
.feedback-banner { ... }
.empty-state { ... }
```

with the new paper/ink system, tighter spacing, cleaner borders, and clearer hover/focus states.

**Step 3: Tune feature-level CSS**

Update plans, settings, and users styles so their tables, modal shells, and grouped controls match the new shared primitives instead of fighting them.

**Step 4: Verify styling consistency**

Run: `npm run lint`
Expected: no lint regressions from markup/class adjustments.

### Task 4: Redesign the dashboard composition

**Files:**
- Modify: `/Users/admin/Desktop/逆向/src/pages/DashboardPage.jsx`
- Modify: `/Users/admin/Desktop/逆向/src/styles/dashboard.css`
- Modify: `/Users/admin/Desktop/逆向/src/styles/layout.css`
- Test: `/Users/admin/Desktop/逆向/src/pages/DashboardPage.test.jsx`

**Step 1: Write the failing dashboard structure test**

Add or update a dashboard test so the first screen expects the new grouped structure rather than only a flat card grid.

**Step 2: Recompose the dashboard markup**

Keep the real data flow intact, but regroup the UI into:

```jsx
<section className="dashboard-intro">...</section>
<section className="dashboard-focus-grid">...</section>
<section className="split-grid">...</section>
```

Use one stronger summary composition and cleaner operational sections.

**Step 3: Rebuild dashboard-specific CSS**

Make the timer, metrics, and daily task area carry more contrast and stronger hierarchy without adding decorative widgets.

**Step 4: Verify the dashboard**

Run: `npm test -- DashboardPage`
Expected: the dashboard test passes with the new structure.

### Task 5: Run full verification and publish the visual refresh

**Files:**
- Modify: `/Users/admin/Desktop/逆向/README.md` (only if setup or screenshots notes need a brief update)

**Step 1: Run the full quality suite**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands pass; the existing large chunk warning may remain during build.

**Step 2: Review git state**

Run:

```bash
git status --short
git diff -- src/layout src/pages src/styles README.md
```

Expected: only the intended visual refresh files are changed.

**Step 3: Commit**

Run:

```bash
git add src/layout src/pages src/styles README.md docs/plans/2026-03-26-frontend-system-refresh-design.md docs/plans/2026-03-26-frontend-system-refresh.md
git commit -m "feat: refresh app visual system"
```

Expected: the visual refresh is committed with documentation.
