---
name: react
description: >
  React 19 best practices and conventions.
  Trigger: When working with React components, hooks, or state.
allowed-tools: Read, Edit, Write
---

## Server Components by Default

- **ALWAYS** assume a component is a Server Component unless it needs interactivity.
- **ONLY** add `"use client"` at the very top of the file when using:
  - `useState`, `useReducer`, `useEffect`
  - Event listeners (`onClick`, `onChange`)
  - Browser-only APIs

## Data Fetching

- **Use** `async/await` in Server Components for data fetching.
- **Use** the `use` hook in Client Components if suspending is required (experimental/React 19).

```tsx
// ✅ Server Component Fetching
export default async function Page() {
  const data = await getData();
  return <div>{data.title}</div>;
}
```

## Hooks

- **AVOID** `useMemo` and `useCallback` unless specifically optimizing for a verified performance bottleneck or referential equality. React Compiler handles most memoization.

## Component Structure

- **ALWAYS** name components with PascalCase.
- **ALWAYS** export components as default unless part of a utility barrel.
