---
name: typescript
description: >
  TypeScript strict patterns and best practices.
  Trigger: When implementing or refactoring TypeScript in .ts/.tsx.
allowed-tools: Read, Edit, Write, Glob, Grep
---

## Const Types Pattern (REQUIRED)

```typescript
// ✅ ALWAYS: Create const object first, then extract type
const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS];

// ❌ NEVER: Direct union types
type Status = "active" | "inactive" | "pending";
```

## Flat Interfaces (REQUIRED)

```typescript
// ✅ ALWAYS: One level depth, nested objects → dedicated interface
interface UserAddress {
  street: string;
  city: string;
}

interface User {
  id: string;
  name: string;
  address: UserAddress;
}
```

## Strict Typing

- **NEVER** use `any`. Use `unknown` if necessary and narrow the type.
- **ALWAYS** define return types for exported functions.
- **ALWAYS** use strict null checks (enabled by default in tsconfig).
