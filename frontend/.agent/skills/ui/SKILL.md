---
name: ui
description: >
  UI Component guidelines and Shadcn usage.
  Trigger: When creating, modifying, or adding UI components.
allowed-tools: Read, Edit, Write, mcp_shadcn_search_items_in_registries, mcp_shadcn_get_add_command_for_items
---

## Design System Integration

- **ALWAYS** load and respect `.interface-design/system.md` when making UI changes.
- Follow its tokens (colors, radius, typography) and patterns (especially for
  `TimeBlockPlanner` and debug UI / `data-component` usage).
- Favor theme-driven classes (e.g. `bg-background`, `bg-card`, `text-foreground`)
  and values derived from `globals.css` instead of hard-coded colors.

## Shadcn UI (MCP Integrated)

This project uses Shadcn UI. You have access to the **shadcn MCP server** to help you adding components.

### Adding New Components
**ALWAYS** follow this workflow when asked to add a standard UI component (button, card, dialog, etc.):

1.  **Search** for the component first to get its correct registry name:
    ```
    Call mcp_shadcn_search_items_in_registries(query="component-name", registries=["@shadcn"])
    ```
2.  **Get Install Command**:
    ```
    Call mcp_shadcn_get_add_command_for_items(items=["@shadcn/component-name"])
    ```
3.  **Execute**: Run the returned command (usually `npx shadcn@latest add ...`) using `run_command`.

### Icons

- **Use** `lucide-react` for icons.
- Import individual icons: `import { Heart } from "lucide-react"`.

### Component Composition

- **Use** Radix UI primitives (via shadcn) for accessible interactive components.
- **Keep** components small and focused.
- **ALWAYS** add `data-component="ComponentName"` to the root element of your component for the Debug UI mode.
