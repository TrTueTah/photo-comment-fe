# Research: Photo Comment Web Application

**Feature**: `001-photo-comment-web`
**Date**: 2026-03-06
**Purpose**: Resolve all technical unknowns before Phase 1 design

---

## 1. Ant Design Compatibility with React 19 / Next.js 16

**Decision**: Use `antd` v5 (latest stable ≥ 5.x).

**Rationale**: Ant Design v5 officially supports React 18+ and is compatible
with React 19. It ships its own CSS-in-JS (using `@ant-design/cssinjs`) which
works correctly in Next.js App Router without requiring additional configuration
for server-side rendering, as long as `StyleProvider` is applied at the root
layout and `AntdRegistry` (from `@ant-design/nextjs-registry`) is used for
SSR style extraction to prevent FOUC (flash of unstyled content).

**Alternatives considered**:
- antd v4: Dropped — uses deprecated CSS class approach; no tree-shaking; not
  actively maintained for new React versions.
- MUI / Chakra: Rejected — constitution mandates Ant Design exclusively.

**Action**: Install `antd` and `@ant-design/nextjs-registry`. Wrap root layout
`<body>` with `<AntdRegistry>`.

---

## 2. Token Refresh Interceptor in Next.js App Router

**Decision**: Implement the token refresh logic in a custom `apiFetch` wrapper
in `lib/api/client.ts` (client-side only). Use an in-memory token store with
a React Context provider for access token; store refresh token in
`localStorage` for persistence across page reloads.

**Rationale**:
- Next.js App Router Server Components cannot access browser APIs or maintain
  in-memory auth state. All authenticated API calls that depend on tokens MUST
  happen in Client Components or client-side service functions.
- The `apiFetch` wrapper:
  1. Attaches `Authorization: Bearer <accessToken>` to every request.
  2. On `401` from any protected endpoint, calls `POST /auth/refresh`.
  3. On refresh success: updates the in-memory token store and retries the
     original request exactly once.
  4. On refresh failure (`401` from refresh): clears tokens and triggers a
     redirect to `/login`.
- A `isRefreshing` flag + a queue of pending requests prevents multiple
  simultaneous refresh calls (thundering herd protection).

**Alternatives considered**:
- Next.js middleware with `httpOnly` cookies: Ideal for security but requires
  backend cooperation to set cookies; backend currently returns JSON tokens.
  Can be adopted in a later version.
- Per-component retry logic: Rejected — duplicates logic, violates Principle IV.

**Token storage**:
- Access token: React Context (in-memory) — lost on page reload, recovered via
  refresh token.
- Refresh token: `localStorage` — persists across reloads. Acceptable security
  trade-off for this assignment scope.

---

## 3. Google OAuth Callback in a SPA (postMessage Pattern)

**Decision**: Open Google OAuth in a popup window. The callback page
(`/auth/google/callback`) reads the tokens from the server JSON response and
uses `window.opener.postMessage(tokens, window.origin)` to pass them to the
opener, then closes itself.

**Rationale**:
- The backend `GET /auth/google/callback` returns JSON with `accessToken` and
  `refreshToken`. In a traditional redirect-only flow the app would need to
  parse tokens from a URL fragment or redirect, which exposes tokens in browser
  history.
- The popup + postMessage approach:
  1. Main page calls `window.open('/auth/google', 'google-auth', 'width=500,height=600')`.
  2. Backend redirects through Google consent screen.
  3. Callback page at `/auth/google/callback` receives JSON, calls
     `window.opener.postMessage({ accessToken, refreshToken }, window.location.origin)`,
     then `window.close()`.
  4. Main page listener receives tokens, stores them, navigates to `/feed`.
- No tokens in URL history. Clean UX.

**Alternatives considered**:
- Full-page redirect with tokens in query string: Rejected — tokens visible in
  browser history/server logs.
- iframe: Rejected — blocked by Google's `X-Frame-Options`.

---

## 4. S3 Presigned URL Direct Upload Pattern

**Decision**: Three-step upload sequence in a single async function in
`lib/api/photos.ts`:
1. `POST /photos/presign` → get `{ presignedUrl, key, expiresIn }`.
2. `PUT presignedUrl` using `fetch` (not axios) with `Content-Type` header
   matching the MIME type sent to step 1. **Do NOT include `Authorization`
   header on this call** — S3 validates the embedded query params instead.
3. On S3 `200`: `POST /photos` with `{ key, caption }`.

**Rationale**:
- The api-handoff doc explicitly requires this three-step flow and warns about
  the `Content-Type` mismatch case (returns `403` from S3).
- Wrapping all three steps in one service function keeps components free of
  upload orchestration logic (Principle IV — API-Driven Data Layer).
- Client-side file type and size validation MUST happen before step 1 to avoid
  wasting presign quota on rejected files (Principle V — YAGNI / no waste).

**Accepted MIME types** (enforced client-side before step 1):
`image/jpeg`, `image/png`, `image/gif`, `image/webp`

**Max file size**: 10 MB enforced client-side. Backend does not enforce in v1.

**Error handling**:
- Step 1 failure (`400`/`401`/`422`): Surface error to user, abort.
- Step 2 failure (S3 `403`/network): Surface error to user, abort.
  Do NOT proceed to step 3.
- Step 3 failure (`400`/`401`): Surface error to user. Log the orphaned S3 key
  for debugging (console.warn in dev).

---

## 5. State Management Approach

**Decision**: React Context + `useState`/`useReducer` only. No external state
library (Redux, Zustand, Jotai, etc.).

**Rationale**: The feature scope is small (auth state + a single feed list +
per-photo comment list). React's built-in primitives are sufficient. Adding a
state management library would violate Principle V (YAGNI).

**Contexts needed**:
- `AuthContext`: holds `{ user, accessToken, refreshToken, login, logout }`.
  Provided at the root layout (Client Component wrapper).
- Local state only for feed data and comments (fetched on mount per page/
  component, not shared globally).

---

## 6. Routing & Page Structure

**Decision**: Next.js App Router with route groups.

```
app/
├── (auth)/          ← public, no nav bar
│   ├── login/
│   └── register/
├── (main)/          ← protected, with nav bar
│   ├── feed/        ← photo feed (home)
│   └── photos/[photoId]/   ← single photo + comments
├── auth/google/callback/   ← OAuth callback page
├── layout.tsx       ← root layout (AntdRegistry, AuthProvider)
└── middleware.ts    ← redirect unauthenticated users to /login
```

**Route protection**: Next.js `middleware.ts` checks for a `session` cookie or
uses `localStorage` via a client-side redirect guard in the root layout. Since
tokens are stored in memory/localStorage (not cookies), route protection is
handled client-side in a `<ProtectedLayout>` wrapper component that redirects
to `/login` if no access token is available.

**Alternatives considered**:
- Middleware with cookie-based auth: Better security but requires backend to
  set `httpOnly` cookies, which is out of scope for this assignment.

---

## 7. Photo Comments UX — Inline Panel vs. Separate Page

**Decision**: Separate page at `/photos/[photoId]` showing the photo and its
comment thread below, with an inline comment input form.

**Rationale**: Keeps the feed page clean. A dedicated URL makes the feature
independently testable and demo-able. An inline modal/drawer is also
acceptable per the spec assumptions but a page provides a shareable URL.

---

## Summary of Resolved Unknowns

| Unknown | Resolution |
|---------|-----------|
| Ant Design / React 19 compatibility | antd v5 + `@ant-design/nextjs-registry` |
| Token refresh interceptor | Custom `apiFetch` wrapper with in-memory queue |
| Token storage | Access: React Context (memory); Refresh: localStorage |
| Google OAuth in SPA | Popup + postMessage from callback page |
| S3 upload orchestration | 3-step service function in `lib/api/photos.ts` |
| State management | React Context + local useState only |
| Route protection | Client-side `<ProtectedLayout>` component |
| Comments UX | Dedicated `/photos/[photoId]` page |
