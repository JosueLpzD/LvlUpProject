# Design System

A living memory of interface decisions for `lvlup`.

## Direction

**Personality:** Premium, Dynamic, Focused
**Aesthetics:** Dark mode first, Glassmorphism, Neon accents
**Core Philosophy:** "The USER should be wowed at first glance."

## Tokens

### Colors (Tailwind v4 / OKLCH)
Derived from `globals.css` and `tailwind.config.ts`.

- **Background:** `oklch(0.145 0 0)` (Dark / Void)
- **Foreground:** `oklch(0.985 0 0)` (White)
- **Primary:** `oklch(0.922 0 0)` (Bright White/Grey)
- **Sidebar:** `oklch(0.205 0 0)` (Dark Grey Surface)
- **Sidebar Accent:** `oklch(0.269 0 0)` (Hover State)
- **Primary Accent:** `oklch(0.488 0.243 264.376)` (Blue-Purple / Chart-1)
- **Debug Green:** `#00ff41` (Matrix Green - used for debug UI)

### Radius
- **Base:** `0.625rem` (10px) - Soft, modern corners.
- **Sm:** `calc(var(--radius) - 4px)` (6px)
- **Lg:** `var(--radius)` (10px)
- **Xl:** `calc(var(--radius) + 4px)` (14px)

### Typography
- **Sans:** `var(--font-geist-sans)`
- **Mono:** `var(--font-geist-mono)`

## Patterns

### Layout
- **Sidebar:** Collapsible, persistent left navigation.
- **Focus Mode:** Ability to hide Sidebar, Header, and Floating elements for deep work (TimeBlockPlanner).
- **Glassmorphism:** Use `backdrop-blur-md` and `bg-background/80` for overlays and sticky headers.

### TimeBlockPlanner
- **Structure:**
    - **Drop Zone:** Unified container, no internal 15-min grid lines.
    - **Blocks:** Fixed width (e.g., 25%), top-aligned icons.
    - **Arrangement:** Horizontal stacking for overlapping blocks in the same time slot.
- **Visuals:** Compact, squared aesthetic.

### Components (Shadcn)
- **Card:** `bg-card text-card-foreground border-border`
- **Button:** `h-10 px-4 py-2` (Default), `rounded-md`
- **Input:** `bg-transparent border-input`

## Decisions Log

| Decision | Rationale | Date |
|----------|-----------|------|
| **System Init** | Created `.interface-design/system.md` to persist design memory. | 2026-01-23 |
| **Radius 10px** | Aligns with "Premium" soft look vs "Technical" sharp look. | 2026-01-23 |
| **Debug Mode** | Matrix Green outlines for high-contrast debugging. | 2026-01-23 |
