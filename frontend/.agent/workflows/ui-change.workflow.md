---
name: ui-change
description: >
  Guided workflow for UI changes in the lvlup project using Antigravity agents,
  enforcing design and implementation best practices.
target-areas:
  - "src/app/**"
  - "src/components/**"
recommended-skills:
  - ui
  - ui-ux-pro-max
  - nextjs
  - react
  - tailwind
  - typescript
---

# Workflow: UI Change

Use this workflow when the user asks for any of the following:
- New UI components or screens.
- Refactors of existing UI.
- Visual redesigns or layout changes.

## Steps

1. **Load Design Context**
   - Read `.interface-design/system.md` to understand the current design
     direction, tokens (colors, radius, typography), and patterns (especially
     TimeBlockPlanner behavior and debug UI requirements).

2. **Select Relevant Skills**
   - Activate the `ui`, `nextjs`, `react`, `tailwind`, and `typescript` skills.
   - Follow their rules about App Router, server/client components, Tailwind v4
     usage, and TypeScript strictness.

3. **Plan the Change**
   - Describe the intended UI change at a high level (components to touch,
     expected layout, any new tokens or patterns).
   - Ensure the plan does not conflict with decisions logged in
     `.interface-design/system.md`.

4. **Implement Safely**
   - Apply changes in the relevant files under `src/app` and `src/components`.
   - Ensure root elements of new components include a `data-component` attribute
     with a meaningful name for Debug UI mode.

5. **Verify**
   - If possible, run the project dev server and visually inspect the result in
     the browser (browser subagent).
   - Check that Debug UI mode outlines and labels the new/updated components
     correctly.

6. **Summarize**
   - Provide a concise summary of the UI changes, including which parts of the
     design system were used or updated.
