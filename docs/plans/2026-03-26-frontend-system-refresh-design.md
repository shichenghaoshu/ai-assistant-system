# Frontend System Refresh Design

**Date:** 2026-03-26

**Goal**

Upgrade the recreated app from a safe glassmorphism admin surface into a more deliberate study workspace with stronger hierarchy, cleaner information density, and a consistent visual system across shell, forms, tables, metrics, and feedback states.

## Chosen Direction

The UI will follow a "study operations desk" direction:

- bright overall canvas, but with more contrast and structure than the current blue frosted treatment
- dark, editorial-feeling navigation rail that anchors the product identity
- warm paper-like content surfaces with restrained cobalt as the single accent
- fewer cards, more layout-led sections, dividers, strips, and disciplined typography

This keeps the app practical for high-frequency use while making the product feel more intentional and premium.

## Frontend Skill Working Model

- **Visual thesis:** a bright, high-focus learning workspace with an inky navigation spine, warm paper surfaces, and crisp cobalt action states.
- **Content plan:** shell establishes brand and orientation, dashboard establishes pace and daily context, business pages become calmer working surfaces with fewer containers and stronger row rhythm.
- **Interaction thesis:** the shell gains subtle motion presence, active navigation becomes more directional, and lists/forms get tighter hover, focus, and state transitions rather than decorative animation.

## System-Level Changes

### Color and Material

- Replace the current all-over pale blue glass treatment with a split system:
  - deep ink sidebar
  - soft paper content area
  - lifted but mostly opaque working surfaces
- Keep one accent color for action and selection.
- Use warmer neutrals so the interface feels less generic and less template-like.
- Reserve stronger color for status feedback, not for every block.

### Typography

- Introduce a more intentional type pairing:
  - a sharper display face for headings, large metrics, and brand moments
  - a cleaner UI face for body, forms, tables, and dense operational copy
- Strengthen hierarchy through size, weight, spacing, and casing instead of adding more boxes.

### Surface Strategy

- The main shell should no longer rely on every section being a rounded glass card.
- Shared components will be regrouped into a small system:
  - app shell
  - section panel
  - metric strip
  - toolbar bar
  - data table shell
  - form field shell
  - inline feedback banner
  - empty state block
- Cards remain only where the block itself is the unit of interaction.

## Shell Redesign

### Sidebar

- Convert the sidebar into the strongest visual anchor in the app.
- Give the brand block a more editorial treatment with clearer separation from the nav tree.
- Make section labels feel quieter and route labels feel more confident.
- Improve active state so it reads as directional selection, not just a slightly brighter chip.

### Topbar

- Reduce the topbar chrome and make it read like workspace context, not a dashboard badge row.
- Keep route metadata, but present it with better hierarchy and less pill clutter.
- Improve spacing so the page title leads the viewport more clearly.

### Main Content Frame

- Relax the oversized frosted wrapper around every route.
- Keep a strong outer rhythm and page width, but let sections breathe.
- Use vertical cadence and horizontal alignment as the main organizing device.

## Page Pattern Changes

### Dashboard

- Rework the first screen into a stronger operating surface rather than a grid of equal cards.
- Combine profile context and key metrics into one coherent hero composition.
- Keep the focus timer large and intentional, with better contrast and fewer boxed sub-panels.
- Convert recent plans and task groups into calmer list-driven sections.

### Forms

- Field shells should feel more precise and tactile.
- Improve focus treatment, label spacing, and grouped inputs.
- Standardize action rows so primary and secondary actions scan consistently.

### Tables and Lists

- Move away from "table inside a card inside a panel" where possible.
- Use row rhythm, separators, hover wash, and better header typography to make dense data easier to scan.
- Shared list and table styling should power plans, exams, users, and system pages.

### Feedback and Empty States

- Banner, warning, success, and info states should share one geometry and one spacing model.
- Empty states should feel intentional, not like a default dashed placeholder.

## Motion

The redesign will stay restrained and fast:

- the sidebar brand and nav will have subtle entrance presence
- active route transitions and list hover states will feel sharper
- buttons, fields, and row interactions will get more consistent transitions

Motion should improve perceived quality without turning the product into a landing page.

## Implementation Scope

The refresh will focus on shared structure first and then tune the highest-impact pages:

1. global tokens, typography, and background system
2. shell components and shared layout classes
3. common form, banner, list, table, and empty-state primitives
4. dashboard composition
5. page-level CSS tuning for plans, users, settings, and adjacent high-traffic pages

## Verification

Success means:

- the shell has a clearly different visual identity
- the dashboard reads as a designed workspace instead of a card mosaic
- forms and tables across modules feel like one product system
- desktop and mobile layouts remain functional
- existing tests, lint, and build continue to pass
