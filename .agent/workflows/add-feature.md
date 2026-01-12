---
description: How to add a new feature using the Feature-based architecture
---

# Adding a New Feature

This project uses a **Feature-based Architecture** with:

- **React Query** for Server State management
- **Zustand** for Client State management
- **Next.js App Router** conventions

## Feature Structure

Each feature should follow this structure:

```
src/features/
  └── [feature-name]/
       ├── api/             # Pure API functions (no hooks)
       │    ├── getXxx.ts   # GET requests
       │    ├── xxxMutations.ts  # POST/PUT/DELETE
       │    └── index.ts    # Barrel export
       ├── hooks/           # React Query hooks ('use client')
       │    ├── useXxx.ts   # Query hooks
       │    ├── useXxxMutations.ts  # Mutation hooks
       │    └── index.ts    # Barrel export
       ├── stores/          # Zustand stores ('use client')
       │    └── useXxxStore.ts
       ├── components/      # Feature-specific components ('use client')
       │    └── XxxComponent.tsx
       ├── types/           # TypeScript types
       │    └── index.ts
       └── index.ts         # Public API (what other modules can import)
```

## Next.js App Router Considerations

### 1. Client vs Server Components

- **hooks/** - MUST have `'use client'` at the top (React Query hooks)
- **stores/** - MUST have `'use client'` at the top (Zustand stores)
- **components/** - MUST have `'use client'` if using hooks
- **api/** - Pure functions, can be used in both client and server
- **types/** - Pure types only, no client directive needed

### 2. Provider Setup

The `QueryProvider` is already configured in `src/app/layout.tsx`. It wraps all children with React Query context.

```tsx
// src/app/layout.tsx
import { QueryProvider } from "@/lib/query-client";

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

### 3. Environment Variables

Use `NEXT_PUBLIC_` prefix for client-side environment variables:

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
```

## Step-by-Step Guide

### 1. Define Types (`types/index.ts`)

```typescript
// Types for API responses
export interface MyEntity {
  id: string;
  name: string;
}

export interface MyEntityListResponse {
  items: MyEntity[];
}

// Types for UI state
export interface MyFilters {
  search: string;
  status: string | "all";
}
```

### 2. Create API Functions (`api/getXxx.ts`)

```typescript
// No 'use client' needed - pure functions
import { apiGet } from "@/lib/api-fetch";
import type { MyEntityListResponse } from "../types";

export async function getMyEntities(): Promise<MyEntityListResponse> {
  return apiGet<MyEntityListResponse>("/api/my-entities");
}
```

### 3. Create Zustand Store (`stores/useMyStore.ts`)

```typescript
"use client"; // REQUIRED for Next.js App Router

import { create } from "zustand";
import type { MyFilters } from "../types";

interface MyStoreState {
  filters: MyFilters;
  setSearch: (search: string) => void;
}

export const useMyStore = create<MyStoreState>((set) => ({
  filters: { search: "", status: "all" },
  setSearch: (search) =>
    set((state) => ({ filters: { ...state.filters, search } })),
}));

// Selectors for optimized re-renders
export const useMyFilters = () => useMyStore((state) => state.filters);
```

### 4. Create React Query Hooks (`hooks/useMyEntities.ts`)

```typescript
"use client"; // REQUIRED for Next.js App Router

import { useQuery } from "@tanstack/react-query";
import { getMyEntities } from "../api/getXxx";
import { useMyFilters } from "../stores/useMyStore";

// Query key factory
export const myEntityKeys = {
  all: ["myEntities"] as const,
  lists: () => [...myEntityKeys.all, "list"] as const,
};

export function useMyEntities() {
  const filters = useMyFilters();

  const query = useQuery({
    queryKey: myEntityKeys.lists(),
    queryFn: getMyEntities,
  });

  // Client-side filtering
  const filtered = query.data?.items.filter((item) => {
    if (filters.search) {
      return item.name.toLowerCase().includes(filters.search.toLowerCase());
    }
    return true;
  });

  return {
    ...query,
    items: filtered ?? [],
  };
}
```

### 5. Create Public API (`index.ts`)

```typescript
// Types
export * from "./types";

// Hooks
export { useMyEntities, myEntityKeys } from "./hooks/useMyEntities";

// Store selectors (only export what's needed)
export { useMyFilters } from "./stores/useMyStore";
```

### 6. Add to Central Export

Update `src/features/index.ts`:

```typescript
export * from "./my-feature";
```

### 7. Use in Page (`app/xxx/page.tsx`)

```tsx
import { MyList } from "@/features/my-feature";

// This is a Server Component by default
export default function MyPage() {
  return (
    <main>
      <h1>My Feature</h1>
      {/* Client Component that uses hooks */}
      <MyList />
    </main>
  );
}
```

## Key Principles

| State Type       | Tool        | Example                               |
| ---------------- | ----------- | ------------------------------------- |
| **Server State** | React Query | API data, loading states, cache       |
| **Client State** | Zustand     | Filters, modal open/close, selections |
| **Local State**  | useState    | Input values, dropdown open           |

## Benefits

1. **Auto-refetching**: React Query key depends on Zustand filters → auto refetch when filters change
2. **No useEffect**: No manual data fetching with useEffect
3. **Cache**: Built-in caching with configurable staleTime
4. **Clean Components**: Components only focus on rendering
5. **Easy Mutations**: Automatic cache invalidation after mutations
6. **SSR Compatible**: Works with Next.js App Router

## File Checklist

When creating a new feature, ensure:

- [ ] `types/index.ts` - Type definitions
- [ ] `api/*.ts` - API functions (no 'use client')
- [ ] `hooks/*.ts` - React Query hooks WITH `'use client'`
- [ ] `stores/*.ts` - Zustand store WITH `'use client'`
- [ ] `components/*.tsx` - Components WITH `'use client'` if using hooks
- [ ] `index.ts` - Public API exports
- [ ] Update `src/features/index.ts` - Add to central export
