---
name: nextjs
description: >
  Next.js 16 conventions and patterns.
  Trigger: When working with routing, layouts, pages, or API routes.
allowed-tools: Read, Edit, Write
---

## App Router Structure

- **ALWAYS** use the App Router (`app/` directory).
- **Colocate** generic components used only by a specific route within that route's folder (e.g., `app/dashboard/_components/`).

## Server Actions

- **Use** Server Actions for all mutations (form submissions, data updates).
- **Define** actions in a separate file (e.g., `actions.ts`) or inline with `"use server"`.

```typescript
// actions.ts
"use server";

export async function createItem(formData: FormData) {
  // logic
}
```

## Metadata

- **Use** the Metadata API for SEO.
- **Export** a `metadata` constant or `generateMetadata` function from `layout.tsx` or `page.tsx`.

## Image Optimization

- **ALWAYS** use `next/image` for images.
