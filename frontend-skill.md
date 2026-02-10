# Frontend React/Next — Unified Technical Master Guide

> **Source**: Synthesized from **36 skill files** across `next-skills/`, `claude-skills/`, and `next-cache-components/` repositories.
> **Stack**: Next.js 16.1.1 · React 19.2.3 · Tailwind CSS v4.1.18 · shadcn/ui · Zustand 5.0.10 · TanStack Query 5.90+ · React Hook Form 7.70 · Zod 4.3.5 · Clerk Auth v6 · AutoAnimate 0.9.0
> **Last Updated**: 2026-02-10

---

## Table of Contents

1. [Next.js 16 Core Architecture](#1-nextjs-16-core-architecture)
2. [Breaking Changes Reference](#2-breaking-changes-reference)
3. [Data Patterns & Caching](#3-data-patterns--caching)
4. [React 19.2 Features](#4-react-192-features)
5. [Tailwind CSS v4 + shadcn/ui Theming](#5-tailwind-css-v4--shadcnui-theming)
6. [State Management — Zustand](#6-state-management--zustand)
7. [Server State — TanStack Query](#7-server-state--tanstack-query)
8. [Forms — React Hook Form + Zod](#8-forms--react-hook-form--zod)
9. [Authentication — Clerk Auth v6](#9-authentication--clerk-auth-v6)
10. [Animations & Motion](#10-animations--motion)
11. [Accessibility (WCAG 2.1 AA)](#11-accessibility-wcag-21-aa)
12. [Image, Font & SEO Optimization](#12-image-font--seo-optimization)
13. [Bundling & Turbopack](#13-bundling--turbopack)
14. [Deployment & Self-Hosting](#14-deployment--self-hosting)
15. [Color Palette & Favicon Generation](#15-color-palette--favicon-generation)
16. [Error Prevention Matrix](#16-error-prevention-matrix)
17. [Version Compatibility Table](#17-version-compatibility-table)

---

## 1. Next.js 16 Core Architecture

### App Router File Conventions

| File | Purpose | Rendering |
|------|---------|-----------|
| `page.tsx` | Route UI | Server Component |
| `layout.tsx` | Shared UI (preserved on navigation) | Server Component |
| `loading.tsx` | Suspense fallback | Server Component |
| `error.tsx` | Error boundary (`'use client'` required) | Client Component |
| `not-found.tsx` | 404 UI | Server Component |
| `route.ts` | API endpoint (no UI) | Server |
| `default.tsx` | Parallel route fallback (**REQUIRED** in v16) | Server Component |
| `global-error.tsx` | Root error boundary | Client Component |
| `template.tsx` | Re-rendered on navigation (no state preservation) | Server Component |

### Route Segments

```
app/
├── (marketing)/          # Route group — no URL impact
├── [slug]/               # Dynamic segment
├── [...slug]/            # Catch-all segment
├── [[...slug]]/          # Optional catch-all
├── @modal/               # Parallel route slot
│   ├── default.tsx       # ← REQUIRED in Next.js 16
│   └── (.)photos/[id]/   # Intercepting route (same level)
├── _private/             # Private folder — excluded from routing
└── proxy.ts              # Network proxy (replaces middleware.ts)
```

### Server vs Client Components — Decision Tree

```
Need interactivity/hooks?  → 'use client'
Need browser APIs?         → 'use client'
Need event handlers?       → 'use client'
Fetching data?             → Server Component (default)
Reading cookies/headers?   → Server Component (async)
Heavy computation?         → Server Component
Need streaming?            → Server Component + Suspense
```

**Critical Rule**: You cannot import a Server Component INTO a Client Component. Pass it as `children` instead:

```tsx
// ✅ Correct pattern
'use client'
export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <div onClick={handleClick}>{children}</div>
}

// In a Server Component
<ClientWrapper>
  <ServerDataComponent />  {/* Passed as children */}
</ClientWrapper>
```

### RSC Boundary Rules

1. **Async client components** → Forbidden. Move `async` to Server Component.
2. **Non-serializable props** → Only JSON-compatible data crosses the boundary.
3. **Server Actions ARE valid** → Functions with `'use server'` can be passed to Client Components.
4. **`instanceof` fails** → Module duplication in RSC. Use `error.name` instead.

---

## 2. Breaking Changes Reference

### Next.js 15 → 16 Migration Checklist

| Change | Action Required |
|--------|----------------|
| **Async route params** | `params: Promise<{ id: string }>` + `await` |
| **Async searchParams** | `searchParams: Promise<{ q: string }>` + `await` |
| **Async cookies/headers** | `await cookies()`, `await headers()` |
| **middleware.ts → proxy.ts** | Rename file + rename export function |
| **Parallel routes** | Add `default.tsx` to EVERY `@slot` folder |
| **`revalidateTag()`** | Now requires 2nd argument: `revalidateTag('tag', 'max')` |
| **`next lint` removed** | Use ESLint/Biome directly |
| **AMP support removed** | Migrate to standard pages |
| **`experimental.ppr` removed** | Use `'use cache'` directive instead |
| **Node.js 18 dropped** | Minimum Node.js 20.9+ |
| **Image defaults changed** | TTL: 4h (was 60s), fewer sizes, single quality |
| **`fetch()` not cached** | Opt-in with `'use cache'` directive |

### Async Params Migration

```tsx
// Server Component
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ query?: string }>
}) {
  const { slug } = await params
  const { query } = await searchParams
  return <div>{slug} - {query}</div>
}

// Client Component — use React.use()
'use client'
import { use } from 'react'

export default function ClientPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <div>{id}</div>
}
```

### Proxy.ts Migration

```tsx
// proxy.ts (replaces middleware.ts)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/dashboard/:path*',
}
```

> **Key difference**: `proxy.ts` runs on Node.js runtime (full Node.js APIs), not Edge runtime.

### Security Advisories (December 2025)

| CVE | Severity | Description |
|-----|----------|-------------|
| CVE-2025-66478 | **CRITICAL (10.0)** | Server Component arbitrary code execution |
| CVE-2025-55184 | HIGH | DoS via malformed request |
| CVE-2025-55183 | MEDIUM | Source code exposure in error responses |

**Action**: Upgrade to Next.js 16.1.1+ immediately.

---

## 3. Data Patterns & Caching

### Data Fetching Strategy

| Pattern | When to Use | Example |
|---------|-------------|---------|
| **Server Component** | Read data on page load | `async function Page()` with `await fetch()` |
| **Server Action** | Mutations (create/update/delete) | `'use server'` function with `revalidateTag()` |
| **Route Handler** | External API, webhooks, third-party | `app/api/*/route.ts` |
| **TanStack Query** | Client-side server state, polling, infinite scroll | `useQuery()` in `'use client'` |

### Avoiding Data Waterfalls

```tsx
// ❌ Sequential — slow
const user = await getUser(id)
const posts = await getPosts(user.id)    // waits for user
const comments = await getComments(posts) // waits for posts

// ✅ Parallel — fast
const [user, posts] = await Promise.all([
  getUser(id),
  getPosts(id),
])
```

### Cache Components (`'use cache'`)

Next.js 16 replaces implicit caching with **opt-in caching** via the `'use cache'` directive.

```tsx
// Component-level caching
'use cache'
export async function ExpensiveComponent() {
  const data = await fetch('https://api.example.com/data')
  return <div>{data.title}</div>
}

// Function-level caching
'use cache'
export async function getExpensiveData(id: string) {
  return await db.query(`SELECT * FROM items WHERE id = $1`, [id])
}
```

### Cache Invalidation APIs

| API | Behavior | Use Case |
|-----|----------|----------|
| `revalidateTag('tag', 'max')` | Stale-while-revalidate | Blog posts, listings |
| `updateTag('tag')` | Immediate refresh (read-your-writes) | User settings, profile |
| `refresh()` | Refresh uncached data only | Real-time dashboards |

```tsx
'use server'
import { updateTag, revalidateTag } from 'next/cache'

// For immediate feedback (forms, settings)
export async function updateProfile(formData: FormData) {
  await db.users.update({ name: formData.get('name') })
  updateTag('user-profile')  // User sees update immediately
}

// For background revalidation (listings, feeds)
export async function publishPost(formData: FormData) {
  await db.posts.create({ title: formData.get('title') })
  revalidateTag('posts', 'max')  // Background refresh
}
```

### Partial Prerendering (PPR)

Cache static parts, render dynamic parts on-demand:

```tsx
// Static header — cached at build
'use cache'
async function StaticHeader() {
  return <header>My App</header>
}

// Dynamic user info — rendered per-request
async function DynamicUserInfo() {
  const cookieStore = await cookies()
  const user = await getUser(cookieStore.get('userId')?.value)
  return <div>Welcome, {user.name}</div>
}

// Page combines both
export default function Dashboard() {
  return (
    <div>
      <StaticHeader />      {/* Cached */}
      <DynamicUserInfo />   {/* Dynamic */}
    </div>
  )
}
```

### Caching Defaults Comparison

| Feature | Next.js 14 | Next.js 15/16 |
|---------|------------|---------------|
| `fetch()` requests | Cached by default | **NOT** cached |
| Router Cache (dynamic) | Cached on client | **NOT** cached |
| Router Cache (static) | Cached | Still cached |
| Route Handlers (GET) | Cached | Dynamic by default |

**Best Practice**: Default to dynamic. Add caching where beneficial, don't debug unexpected cache hits.

---

## 4. React 19.2 Features

### View Transitions

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { startTransition } from 'react'

export function NavigationLink({ href, children }) {
  const router = useRouter()

  return (
    <a href={href} onClick={(e) => {
      e.preventDefault()
      startTransition(() => router.push(href))
    }}>
      {children}
    </a>
  )
}
```

```css
/* globals.css */
@view-transition { navigation: auto; }

.page-title { view-transition-name: page-title; }
```

### React Compiler (Auto-Memoization)

```tsx
// next.config.ts
const config: NextConfig = {
  experimental: { reactCompiler: true },
}

// No more manual useMemo/useCallback needed!
export function ExpensiveList({ items }) {
  const filtered = items.filter(item => item.length > 3) // Auto-memoized
  return <ul>{filtered.map(item => <li key={item}>{item}</li>)}</ul>
}
```

### `useEffectEvent()` (Experimental)

Extract non-reactive logic from `useEffect` to prevent unnecessary re-runs:

```tsx
import { useEffect, experimental_useEffectEvent as useEffectEvent } from 'react'

export function ChatRoom({ roomId }) {
  const onConnected = useEffectEvent(() => {
    console.log('Connected to:', roomId) // Non-reactive
  })

  useEffect(() => {
    const conn = connectToRoom(roomId)
    onConnected()
    return () => conn.disconnect()
  }, [roomId]) // Only roomId triggers re-run
}
```

---

## 5. Tailwind CSS v4 + shadcn/ui Theming

### Architecture Overview (4-Step Process)

Tailwind v4 uses a **CSS-first approach** — no `tailwind.config.ts` needed.

#### Step 1: CSS Variables (Design Tokens)

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  --background: oklch(1 0 0);           /* White */
  --foreground: oklch(0.145 0 0);       /* Near-black */
  --primary: oklch(0.205 0.042 265.755);
  --primary-foreground: oklch(0.985 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
  /* ... destructive, accent, popover, sidebar, chart-1..5 */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0.042 265.755);
  /* ... invert all tokens */
}
```

#### Step 2: Tailwind Mapping

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 0.125rem);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 0.125rem);
}
```

#### Step 3: Base Styles

```css
@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

#### Step 4: Dark Mode (Automatic)

```css
/* Automatic via .dark class on <html> */
@custom-variant dark (&:is(.dark *));
```

### OKLCH Color Space

Tailwind v4 defaults to **OKLCH** for perceptually consistent colors:

```css
/* Instead of hex or HSL */
--primary: oklch(0.205 0.042 265.755);
/*         L     C     H               */
/* L = Lightness (0–1), C = Chroma (saturation), H = Hue (0–360) */
```

### Critical Rules

- ✅ Use `@theme inline` (NOT `@theme` alone — prevents CSS file generation)
- ✅ Use CSS variables with OKLCH values
- ✅ Always pair background + foreground tokens
- ❌ Never use `tailwind.config.ts` (v4 is CSS-first)
- ❌ Never use `@apply` in `@theme` blocks
- ❌ Never reference `--color-*` inside `:root` (use `--background`, etc.)

### v3 → v4 Migration Checklist

| v3 Pattern | v4 Replacement |
|-----------|----------------|
| `tailwind.config.ts` | `@theme inline` in CSS |
| `hsl(var(--primary))` | `var(--primary)` (direct) |
| `extend.colors.border` | `--color-border: var(--border)` |
| `darkMode: "class"` | `@custom-variant dark` |
| `rounded-lg` hardcoded | `--radius-lg: calc(var(--radius) + 0.125rem)` |

---

## 6. State Management — Zustand

### Store Setup

```tsx
import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

interface AppState {
  count: number
  user: { name: string; email: string } | null
  increment: () => void
  setUser: (user: AppState['user']) => void
}

export const useAppStore = create<AppState>()(  // Double parentheses for TypeScript!
  devtools(
    persist(
      (set) => ({
        count: 0,
        user: null,
        increment: () => set((state) => ({ count: state.count + 1 })),
        setUser: (user) => set({ user }),
      }),
      { name: 'app-storage' }
    )
  )
)
```

### Preventing Infinite Renders with `useShallow`

```tsx
import { useShallow } from 'zustand/react/shallow'

// ❌ Creates new object reference every render → infinite loop
const { count, user } = useAppStore((state) => ({
  count: state.count,
  user: state.user,
}))

// ✅ Stable reference with useShallow
const { count, user } = useAppStore(
  useShallow((state) => ({ count: state.count, user: state.user }))
)
```

### Next.js SSR Hydration

```tsx
// Prevent hydration mismatch with persist middleware
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'app-storage',
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true)
      },
    }
  )
)

// In component — show loading until hydrated
const hasHydrated = useAppStore((s) => s._hasHydrated)
if (!hasHydrated) return <Skeleton />
```

### Slices Pattern (Large Stores)

```tsx
const createUserSlice = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
})

const createCartSlice = (set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
})

export const useStore = create()((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a),
}))
```

### Key Gotchas

- ❌ Single selector for `(s) => s` — subscribes to all changes
- ❌ `persist` v5.0.10+ fixed race conditions — update to latest
- ❌ `isLoading` meaning changed in v5 — verify behavior
- ✅ Always use `useShallow` when selecting multiple fields

---

## 7. Server State — TanStack Query

### Provider Setup (Next.js App Router)

```tsx
// providers/query-provider.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,      // 1 minute
        gcTime: 5 * 60 * 1000,     // 5 minutes (was cacheTime in v4)
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Query Patterns

```tsx
// Basic query
const { data, isPending, error } = useQuery({
  queryKey: ['posts', filters],
  queryFn: () => fetchPosts(filters),
})

// Infinite query
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam }) => fetchFeed(pageParam),
  initialPageParam: 0,  // Required in v5
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  maxPages: 5,  // Memory optimization
})

// Mutation with optimistic update
const mutation = useMutation({
  mutationFn: updatePost,
  onMutate: async (newPost) => {
    await queryClient.cancelQueries({ queryKey: ['posts'] })
    const previous = queryClient.getQueryData(['posts'])
    queryClient.setQueryData(['posts'], (old) =>
      old.map(p => p.id === newPost.id ? { ...p, ...newPost } : p)
    )
    return { previous }
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(['posts'], context.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  },
})
```

### v4 → v5 Migration

| v4 | v5 |
|----|-----|
| `useQuery(key, fn, options)` | `useQuery({ queryKey, queryFn, ...options })` |
| `isLoading` (first load) | `isPending` (no data yet) |
| `cacheTime` | `gcTime` |
| `keepPreviousData` | `placeholderData: keepPreviousData` |
| `onSuccess/onError` on queries | Removed — use `useEffect` |
| `enabled: boolean` | Still works, but `useSuspenseQuery` ignores it |
| No `initialPageParam` | **Required** for infinite queries |

### SSR Hydration with Streaming

```tsx
// Server Component — prefetch
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'

export default async function Page() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostList />
    </HydrationBoundary>
  )
}
```

---

## 8. Forms — React Hook Form + Zod

### Schema-First Pattern

```tsx
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// 1. Define schema
const formSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
  role: z.enum(['admin', 'user']),
  bio: z.string().max(500).optional(),
  age: z.coerce.number().min(18),  // Coerce string → number
})

type FormData = z.infer<typeof formSchema>

// 2. Use in component
export function SignUpForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { role: 'user' },
  })

  const onSubmit = async (data: FormData) => {
    const result = await createUser(data)
    if (result.error) {
      // Server-side validation errors
      setError('email', { message: result.error.email })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span role="alert">{errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span role="alert">{errors.password.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Sign Up'}
      </button>
    </form>
  )
}
```

### Dynamic Fields with `useFieldArray`

```tsx
const { fields, append, remove } = useFieldArray({
  control,
  name: 'addresses',
})

return (
  <>
    {fields.map((field, index) => (
      <div key={field.id}>
        <input {...register(`addresses.${index}.street`)} />
        <button type="button" onClick={() => remove(index)}>Remove</button>
      </div>
    ))}
    <button type="button" onClick={() => append({ street: '' })}>
      Add Address
    </button>
  </>
)
```

### Zod v4 New Features

```tsx
// Exact optional (undefined ≠ missing)
z.object({
  name: z.string(),
  middle: z.string().exactOptional(), // Must be present if set
})

// XOR (mutually exclusive)
z.object({
  email: z.string().email(),
}).xor(
  z.object({
    phone: z.string(),
  })
)
```

### Performance — Large Forms

```tsx
// Isolate re-renders with Controller
<Controller
  name="description"
  control={control}
  render={({ field }) => <TextEditor {...field} />}
/>

// Only animate transform + opacity (never width/height/margin)
// Use mode: 'onBlur' for less frequent validation
const form = useForm({ mode: 'onBlur' })
```

### Key Rules

- ✅ Always validate on BOTH client and server
- ✅ Use `z.coerce` for form inputs that submit as strings
- ✅ Use `role="alert"` on error messages for accessibility
- ❌ Zod v4 + older `@hookform/resolvers` → use `@hookform/resolvers@5.2.2+`
- ❌ React Hook Form v8 (beta) has breaking changes — stay on v7

---

## 9. Authentication — Clerk Auth v6

### Setup

```tsx
// src/proxy.ts (NOT middleware.ts in Next.js 16!)
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

### Async `auth()` Helper (v6 Breaking Change)

```tsx
import { auth } from '@clerk/nextjs/server'

// ❌ v5 (synchronous)
const { userId } = auth()

// ✅ v6 (asynchronous)
const { userId } = await auth()
```

### Route Protection in Proxy

```tsx
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtected = createRouteMatcher(['/dashboard(.*)'])
const isAdmin = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect()
  if (isAdmin(req)) await auth.protect({ role: 'org:admin' })
})
```

### UI Components

| Component | Purpose |
|-----------|---------|
| `<SignIn />` | Full sign-in flow |
| `<SignUp />` | Full sign-up flow |
| `<UserButton />` | User menu with sign-out |
| `<SignedIn>` | Render only when authenticated |
| `<SignedOut>` | Render only when unauthenticated |

### Testing

```
Test emails: john+clerk_test@example.com
Fixed OTP:   424242
```

---

## 10. Animations & Motion

### AutoAnimate — Zero-Config Animations

```tsx
// SSR-Safe pattern (critical for Next.js)
import { useState, useEffect } from 'react'

export function useAutoAnimateSafe<T extends HTMLElement>() {
  const [parent, setParent] = useState<T | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && parent) {
      import('@formkit/auto-animate').then(({ default: autoAnimate }) => {
        autoAnimate(parent)
      })
    }
  }, [parent])

  return [parent, setParent] as const
}
```

### Critical AutoAnimate Rules

| ✅ Do | ❌ Don't |
|-------|---------|
| Use unique, stable keys (`key={item.id}`) | Use `key={index}` |
| Keep parent in DOM always | Conditional parent: `{show && <ul ref={parent}>}` |
| Dynamic import for SSR | Static import in Server Component |
| Explicit width for flex items | `flex-grow` on animated elements |
| Apply to `<tbody>` for tables | Animate table rows directly |

### React 19 StrictMode Fix

```tsx
const [parent] = useAutoAnimate()
const initialized = useRef(false)

useEffect(() => {
  if (initialized.current) return
  initialized.current = true
}, [])
```

### Animation Performance Rules

- ✅ Only animate `transform` and `opacity`
- ❌ Never animate `width`, `height`, `margin` (causes layout thrashing)
- ✅ Use `will-change: transform` sparingly
- ✅ Prefer spring animations over linear for UI interactions
- ✅ AutoAnimate respects `prefers-reduced-motion` automatically

---

## 11. Accessibility (WCAG 2.1 AA)

### Quick Checklist

| Category | Requirement |
|----------|-------------|
| **Text contrast** | ≥ 4.5:1 (normal), ≥ 3:1 (large/UI) |
| **Focus indicators** | Never `outline: none` without replacement. Use `:focus-visible` |
| **Images** | `alt=""` for decorative, descriptive alt for meaningful |
| **Forms** | `<label>` for every input. Never placeholder-only |
| **Keyboard** | All interactive elements reachable via Tab |
| **Headings** | `h1 → h2 → h3` — no skipping levels |
| **Color** | Never color-only to convey information |
| **Live regions** | `aria-live="polite"` for dynamic updates |
| **Dialogs** | Focus trap + Escape to close + restore focus |
| **Language** | `<html lang="en">` always |

### Accessible Dialog Pattern

```tsx
function Dialog({ isOpen, onClose, title, children }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const previousFocus = document.activeElement as HTMLElement

    // Focus first focusable element
    const first = dialogRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    first?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      // Focus trap logic...
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus() // Restore focus
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="title">
      <h2 id="title">{title}</h2>
      {children}
      <button onClick={onClose} aria-label="Close dialog">×</button>
    </div>
  )
}
```

### Skip Link

```html
<a href="#main-content" class="skip-link">Skip to main content</a>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  z-index: 9999;
}
.skip-link:focus { top: 0; }
</style>

<main id="main-content" tabindex="-1">...</main>
```

---

## 12. Image, Font & SEO Optimization

### Next.js Image

```tsx
import Image from 'next/image'

// Remote images — configure in next.config.ts
const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.example.com' },
    ],
  },
}

// Responsive image
<Image
  src="/hero.jpg"
  alt="Hero banner"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority  // For above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

### Font Optimization

```tsx
// app/layout.tsx — ONE import, CSS variable approach
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const robotoMono = Roboto_Mono({ subsets: ['latin'], variable: '--font-roboto-mono' })

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

- ❌ Never use `<link>` tags for Google Fonts
- ❌ Never import fonts in every component
- ❌ Never use `@import url(...)` in CSS
- ✅ Always specify `subsets: ['latin']`
- ✅ Use variable fonts (all weights included)

### Metadata & SEO

```tsx
// Static metadata
export const metadata: Metadata = {
  title: 'My App',
  description: 'A description',
  openGraph: {
    title: 'My App',
    images: ['/api/og'],
  },
}

// Dynamic metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { images: [`/api/og?title=${post.title}`] },
  }
}
```

---

## 13. Bundling & Turbopack

### Turbopack (Default in Next.js 16)

- **2–5× faster** production builds
- **10× faster** Fast Refresh in dev
- Opt-out: `npm run build -- --webpack`

### Known Turbopack Issues

| Issue | Workaround |
|-------|-----------|
| Prisma v6.5+ incompatible | `npm run build -- --webpack` |
| Source maps exposed in production | `productionBrowserSourceMaps: false` |
| Monorepo hash mismatches | `serverExternalPackages: ['pkg']` |

### Server-Incompatible Packages

```tsx
// Dynamic import for browser-only libraries
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('recharts'), { ssr: false })
const Editor = dynamic(() => import('react-quill'), { ssr: false })
const Map = dynamic(() => import('mapbox-gl'), { ssr: false })
```

| Package | Issue | Fix |
|---------|-------|-----|
| `sharp` | Native bindings | `serverExternalPackages` |
| `recharts` | Uses `window` | `dynamic(() => import(...), { ssr: false })` |
| `react-quill` | Uses `document` | `dynamic(() => import(...), { ssr: false })` |
| `monaco-editor` | Uses `window` | `dynamic(() => import(...), { ssr: false })` |

---

## 14. Deployment & Self-Hosting

### Docker

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

```tsx
// next.config.ts — enable standalone output
const config: NextConfig = {
  output: 'standalone',
}
```

### Environment Variables

```bash
# Server-only
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...

# Client-accessible (build-time)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
```

### Pre-Deployment Checklist

- ✅ Node.js 20.9+
- ✅ `next.config.ts` with `output: 'standalone'` (if Docker)
- ✅ All `NEXT_PUBLIC_*` vars set at build time
- ✅ Image domains configured in `remotePatterns`
- ✅ `productionBrowserSourceMaps: false` (if Turbopack)
- ✅ Health check endpoint: `app/api/health/route.ts`
- ✅ ISR cache handler for multi-instance (Redis/S3)

---

## 15. Color Palette & Favicon Generation

### Color Palette from Brand Hex

11-shade scale (50–950) with OKLCH or HSL:

| Shade | Lightness | Use Case |
|-------|-----------|----------|
| 50 | 97% | Subtle backgrounds |
| 100-200 | 87-94% | Hover states, borders |
| 300-400 | 62-75% | Disabled states, placeholders |
| **500** | **48%** | **Brand color** |
| 600-700 | 33-40% | Primary actions, hover on primary |
| 800-950 | 10-27% | Active states, text, dark accents |

```css
@theme {
  --color-primary-50: #F0FDFA;
  --color-primary-500: #14B8A6;  /* Brand */
  --color-primary-950: #042F2E;

  --color-background: #FFFFFF;
  --color-foreground: var(--color-primary-950);
  --color-primary: var(--color-primary-600);
}

.dark {
  --color-background: var(--color-primary-950);
  --color-foreground: var(--color-primary-50);
  --color-primary: var(--color-primary-500);
}
```

### Favicon Generation (4-Step Process)

1. **Create SVG** — Extract icon from logo or create monogram
2. **Generate ICO** — `favicon.ico` for legacy browsers (16×32)
3. **Generate PNGs** — `apple-touch-icon.png` (180×180, solid background)
4. **Add HTML** — SVG first, ICO fallback, manifest for PWA

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0066cc">
```

- ❌ Never use transparent backgrounds on iOS icons (black square)
- ❌ Never use CMS default favicons in production
- ✅ Always test at 16×16 zoom for legibility

---

## 16. Error Prevention Matrix

### Next.js Errors (25 Documented)

| # | Error | Fix |
|---|-------|-----|
| 1 | `params` is a Promise | `await params` |
| 2 | `searchParams` is a Promise | `await searchParams` |
| 3 | `cookies()` requires await | `await cookies()` |
| 4 | Missing `default.js` | Add `default.tsx` to every `@slot` |
| 5 | `revalidateTag()` needs 2 args | `revalidateTag('tag', 'max')` |
| 6 | Hooks in Server Component | Add `'use client'` |
| 7 | `middleware.ts` deprecated | Rename to `proxy.ts` |
| 8 | Turbopack build failure | `npm run build -- --webpack` |
| 9 | Invalid `next/image` src | Configure `remotePatterns` |
| 10 | Import Server into Client | Pass as `children` |
| 11 | `generateStaticParams` not working | Add `export const dynamic = 'force-static'` |
| 12 | `fetch()` not caching | Add `'use cache'` directive |
| 13 | Route group collision | Ensure unique URL paths |
| 14 | Metadata not updating | Use `generateMetadata()` |
| 15 | Font not loading | Apply variable to `<html>` |
| 16 | Env vars not in browser | Prefix with `NEXT_PUBLIC_` |
| 17 | Server Action not found | Add `'use server'` directive |
| 18 | TypeScript path alias broken | Configure `paths` in `tsconfig.json` |
| 19 | Navigation throttling | `<Link prefetch={false}>` for redirect routes |
| 20 | Cache + i18n dynamic segments | `generateStaticParams` at each level |
| 21 | `instanceof` fails in RSC | Use `error.name` comparison |
| 22 | Non-serializable props to Client | Pass only JSON-compatible data |
| 23 | Turbopack + Prisma failure | Build with `--webpack` |
| 24 | Turbopack source maps exposed | `productionBrowserSourceMaps: false` |
| 25 | Monorepo module hash mismatch | `serverExternalPackages` |

### Hydration Errors

| Cause | Fix |
|-------|-----|
| `typeof window !== 'undefined'` | Use `useEffect` for browser-only code |
| `new Date()` mismatch | Format dates in `useEffect` or `suppressHydrationWarning` |
| `Math.random()` | Generate in `useEffect` |
| `<div>` inside `<p>` | Fix HTML nesting |
| Third-party scripts | Load with `next/script` + `afterInteractive` |
| Browser extensions | Cannot fix — accept as known issue |

### Library-Specific Errors

| Library | Count | Critical Errors |
|---------|-------|-----------------|
| Zustand | 6 | Hydration mismatch, infinite renders (useShallow), persist race |
| TanStack Query | 16 | `isPending` vs `isLoading`, removed `onSuccess`, infinite queries need `initialPageParam` |
| React Hook Form + Zod | 20 | Zod v4 resolver compat, v8 beta breaking changes |
| AutoAnimate | 15 | React 19 StrictMode, SSR imports, conditional parents |
| Accessibility | 12 | Missing focus indicators, insufficient contrast, form labels |
| Clerk Auth | 8 | Async `auth()`, JWKS cache race, JWT template limits |

---

## 17. Version Compatibility Table

| Package | Minimum | Recommended | Notes |
|---------|---------|-------------|-------|
| Next.js | 16.0.0 | **16.1.1+** | Security patches |
| React | 19.2.0 | 19.2.3+ | View Transitions, Compiler |
| Node.js | 20.9.0 | 20.9.0+ | Node 18 dropped |
| TypeScript | 5.1.0 | 5.7.0+ | — |
| Tailwind CSS | 4.0.0 | **4.1.18** | CSS-first, OKLCH |
| shadcn/ui | — | Latest | Uses Tailwind v4 |
| Zustand | 5.0.0 | **5.0.10+** | Persist race fix |
| TanStack Query | 5.0.0 | **5.90+** | Streaming SSR |
| React Hook Form | 7.0.0 | **7.70.0** | Stay on v7 |
| Zod | 4.0.0 | **4.3.5** | v3 compat mode available |
| @hookform/resolvers | 5.0.0 | **5.2.2+** | Zod v4 support |
| Clerk | 6.0.0 | **6.35.2+** | Next.js 16 cache fix |
| AutoAnimate | 0.8.2 | **0.9.0** | React 19 support |

---

> **Generated from**: `next-skills/` (26 files), `claude-skills/` (10 skills), `next-cache-components/` (1 skill)
> **Total source material**: ~8,200 lines of skill documentation synthesized into a single reference
