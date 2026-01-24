---
name: tailwind
description: >
  Tailwind CSS v4 usage and styling best practices.
  Trigger: When styling components or modifying CSS.
allowed-tools: Read, Edit, Write
---

## v4 Configuration

- **NOTE**: Tailwind v4 uses CSS variables for configuration. Check `index.css` or `globals.css` for theme variables (`--color-*`, `--font-*`).
- **Do NOT** look for `tailwind.config.js` if it doesn't exist; v4 often doesn't need it.

## Class Organization

- **Use** `clsx` or `cn` (shadcn utility) for conditional classes.
- **Order** classes logically (layout -> spacing -> typography -> effects) or use a linter if available.

## Responsive Design

- **ALWAYS** design mobile-first.
- Use `sm:`, `md:`, `lg:` prefixes for larger screens.

## Arbitrary Values

- **Avoid** arbitrary values `w-[123px]` unless absolutely necessary. Use theme spacing.
