---
name: ui-design-consistency
description: >
  Ensure all UI work in the lvlup project follows the interface design system
  and uses the appropriate Antigravity skills for implementation.
scope:
  - "src/app/**"
  - "src/components/**"
required-skills:
  - ui
  - ui-ux-pro-max
  - nextjs
  - react
  - tailwind
  - typescript
related-files:
  - ".interface-design/system.md"
---

# UI Design Consistency Rule

When an agent performs tasks that modify or create UI in this project, it MUST:

1. Load and respect the `ui`, `nextjs`, `react`, `tailwind`, and `typescript` skills.
2. Consult `.interface-design/system.md` for design tokens, layout patterns,
   and TimeBlockPlanner-specific decisions before changing layout or visuals.
3. Ensure that new or updated components include `data-component` attributes
   on their root elements so that Debug UI mode works correctly.
4. Prefer design tokens (background, foreground, card, sidebar, chart-1, etc.)
   and Tailwind classes derived from `globals.css` over hard-coded ad-hoc
   colors when possible.

This rule is especially relevant for components under:
- `src/components/layout` (e.g. `AppShell`)
- `src/components/productivity` (e.g. `TimeBlockPlanner`, `FloatingPomodoro`)
- `src/components/marketplace` and `src/components/progression`.
