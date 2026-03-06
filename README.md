# Photo Comment — Frontend

A photo-sharing web application where authenticated users can browse a feed of uploaded photos, upload their own images, and leave comments. Built as a take-home assignment using Next.js 16, React 19, and Ant Design.

**Backend repo**: [`photo-comment-be`](../photo-comment-be) — NestJS 11 REST API

---

## Features

### Authentication
- **Email & password** registration and login with full form validation
- **Google OAuth** via popup flow — clicking "Sign in with Google" opens a consent window; tokens are passed back to the main window via `postMessage` and the popup closes itself
- **Session persistence** — refresh token stored in `localStorage`; on page reload the user is restored from storage without an API round-trip; the access token is refreshed lazily on the first `401` response
- **Transparent session renewal** — if the refresh token is also expired, the user is redirected to `/login` automatically; all other authenticated pages stay working

### Photo Feed
- All uploaded photos displayed **newest-first**
- Each card shows: image (with broken-image placeholder fallback), caption, uploader name, upload date, and comment count badge
- New uploads **prepend to the feed instantly** without a page reload
- Empty state shown when no photos exist

### Photo Upload
- **Drag-and-drop** file picker inside a modal
- **Client-side validation** before any network call: accepted types (JPEG, PNG, GIF, WebP) and max size (10 MB)
- **Three-step S3 presigned upload** handled by a single service function — get presign URL, PUT file directly to S3, confirm with backend
- Optional caption up to 500 characters with live character count
- Clear loading feedback; error messages preserved so the user can retry without re-selecting the file

### Photo Comments
- Clicking a card opens `/photos/:id` — the full photo with its comment thread below
- Comments listed **oldest-first** with commenter name, text, and timestamp
- Inline comment form with validation (1–2000 chars, not whitespace-only)
- New comments appear immediately on success; comment count in the photo header updates without a reload

---

## Design System

All UI is built exclusively with **Ant Design v5** — no secondary component library.

### Light / Dark Theme

A `ThemeProvider` (`lib/theme/context.tsx`) wraps Ant Design's `ConfigProvider` and switches between `theme.defaultAlgorithm` and `theme.darkAlgorithm`:

- Preference is **persisted to `localStorage`** and restored on load
- Falls back to OS `prefers-color-scheme` on first visit
- Moon/sun toggle button in the navigation bar
- CSS custom properties on `<html>` (`--bg-page`, `--fg-page`) keep native elements (body, headings) in sync with the active theme without hardcoded Tailwind colour classes

### Tokens

| Token | Light | Dark |
|---|---|---|
| Primary colour | `#1677ff` | `#1677ff` |
| Page background | `#f5f5f5` | `#141414` |
| Header background | `#ffffff` | `#1f1f1f` |
| Border radius | `8px` | `8px` |

### Component Map

| Area | Ant Design Components |
|---|---|
| Forms | `Form`, `Form.Item`, `Input`, `Input.Password`, `Input.TextArea` |
| Navigation | `Layout.Header`, `Dropdown`, `Button` |
| Feed | `List`, `Card`, `Image`, `Badge` |
| Upload | `Modal`, `Upload.Dragger` |
| Feedback | `Alert`, `Spin`, `Empty` |
| Typography | `Typography.Title`, `Typography.Text` |

---

## Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Runtime | React 19 |
| Component Library | Ant Design v5 + `@ant-design/nextjs-registry` |
| Styling | Tailwind CSS v4 (layout utilities) + Ant Design design tokens |
| Language | TypeScript 5 (strict) |
| Linting | ESLint 9 with `eslint-config-next` |

### Project Structure

```
app/
├── (auth)/                       # Public route group — no navigation bar
│   ├── login/page.tsx
│   └── register/page.tsx
├── (main)/                       # Protected route group — navigation bar
│   ├── layout.tsx                # Auth guard + FeedContext + UploadModal
│   ├── feed/page.tsx             # Photo feed
│   └── photos/[photoId]/page.tsx # Photo detail + comments
├── auth/callback/page.tsx        # Google OAuth callback (query-param tokens)
├── layout.tsx                    # Root layout: AntdRegistry → ThemeProvider → AuthProvider
└── globals.css                   # CSS variables, body/html base styles

lib/
├── api/
│   ├── client.ts                 # apiFetch / publicFetch, 401 interceptor, token store
│   ├── auth.ts                   # Auth API calls
│   ├── photos.ts                 # Photo API + S3 upload orchestration
│   └── comments.ts               # Comment API calls
├── auth/context.tsx              # AuthProvider — session restore + expired handler
├── theme/context.tsx             # ThemeProvider — ConfigProvider + dark/light toggle
├── types/
│   ├── api.ts                    # API DTO interfaces
│   └── app.ts                    # Client-only state types, accepted MIME types
└── utils/jwt.ts                  # JWT payload decoder for name/email extraction

components/
├── auth/LoginForm.tsx
├── auth/RegisterForm.tsx
├── photos/PhotoFeed.tsx
├── photos/PhotoCard.tsx
├── photos/UploadModal.tsx
├── photos/CommentPanel.tsx
└── shared/AppNav.tsx             # Logo, Upload button, theme toggle, user dropdown
```

### Key Design Decisions

#### Lazy Token Refresh via Interceptor

All authenticated calls go through `apiFetch`. On a `401`:
1. Any in-flight requests are queued while one refresh is attempted
2. `POST /auth/refresh` is called with the stored refresh token
3. All queued requests are retried with the new access token
4. If refresh fails → tokens cleared → redirect to `/login`

`AuthProvider` no longer calls the refresh API on mount. It restores user data from `localStorage` synchronously, so page loads are instant. The interceptor handles obtaining a fresh access token on the first API call.

#### Upload → Feed Without Re-fetch

`(main)/layout.tsx` owns the `UploadModal` and a `FeedContext`. When the feed mounts, it registers an `addPhoto` callback via context. On upload success, the layout calls that callback to prepend the new photo to the feed's in-memory list — no GET request needed.

#### Google OAuth Popup Flow

```
LoginForm                         /auth/callback popup
    │                                     │
    ├─ window.open(GET /auth/google) ───> │
    │                                     ├─ reads ?accessToken & ?refreshToken
    │ <── postMessage({ tokens }) ────────┤
    │                                     └─ window.close()
    ├─ decode JWT → extract name + email
    ├─ authLogin(tokens, user)
    └─ router.replace("/feed")
```

Tokens travel via `postMessage` (same origin only) rather than in the URL, keeping them out of browser history and server logs.

#### Three-Step S3 Direct Upload

```
Browser          Backend              S3
   │── POST /photos/presign ──> │
   │<── { presignedUrl, key } ──│
   │── PUT presignedUrl ─────── │ ──────────> │
   │                            │          200 OK
   │── POST /photos { key } ──> │
   │<── PhotoItem ──────────────│
```

The `Authorization` header is omitted on the S3 `PUT` — authentication is embedded in the presigned URL's query string. Client-side type and size validation runs before step 1 to avoid wasting a presign quota on a rejected file.

---

## Getting Started

### Prerequisites

- Node.js 20+
- The backend running at a known port (see `../photo-comment-be`)

### Setup

```bash
# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Commands

```bash
npm run dev     # Start dev server with hot reload
npm run build   # Production build
npm run start   # Serve production build
npm run lint    # ESLint (must pass with zero errors)
```

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the NestJS backend | `http://localhost:8080` |

---

## AI-Assisted Development Workflow

This project was built using **Claude Code** with a structured AI workflow called **Speckit**. The workflow converts a plain-language requirement into a fully implemented feature through a series of slash commands, each producing a concrete, auditable artifact.

### The Pipeline

```
/speckit.specify  →  /speckit.plan  →  /speckit.tasks  →  /speckit.implement
     spec.md           plan.md +           tasks.md           working code
                      research.md
```

---

#### `/speckit.specify` — Write the Specification

**Input**: Natural language description or a requirements document
**Output**: `specs/<feature>/spec.md`

The specification is technology-agnostic and written for non-technical stakeholders. It defines:
- **User stories** (P1 → P4 priority order) each with acceptance scenarios
- **Functional requirements** (FR-001 through FR-016)
- **Success criteria** — measurable, implementation-free outcomes
- **Key entities** and **assumptions**

A quality checklist (`checklists/requirements.md`) is generated and auto-validated. Any `[NEEDS CLARIFICATION]` markers cause the command to pause and ask targeted questions before proceeding.

For this project the spec was seeded from the backend API handoff document:
```
/speckit.specify @api-handoff.md help me create spec for the Photo comment web
```

---

#### `/speckit.plan` — Research and Architecture

**Input**: `spec.md`
**Output**: `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

Before writing a line of code the planning phase resolves technical unknowns and documents architectural decisions with rationale. Every decision in `research.md` records what was chosen, why, and what was rejected.

Decisions documented for this project:

| Unknown | Decision |
|---|---|
| Ant Design SSR with React 19 | `antd` v5 + `@ant-design/nextjs-registry` for SSR style extraction |
| Token refresh in App Router | Custom `apiFetch` with in-memory queue; lazy refresh on 401 |
| Token storage | Access token: React Context (in-memory); Refresh token: `localStorage` |
| Google OAuth in a SPA | Popup + `postMessage` — tokens never appear in URL or browser history |
| S3 upload orchestration | Three-step service function; no `Authorization` header on S3 PUT |
| State management | React Context + `useState` only — YAGNI, no Redux/Zustand needed |
| Route protection | Client-side `<ProtectedLayout>` guard (tokens not in cookies) |
| Comments UX | Dedicated `/photos/[photoId]` page — clean URL, independently testable |

---

#### `/speckit.tasks` — Generate the Task List

**Input**: `spec.md`, `plan.md`, `data-model.md`, `contracts/`
**Output**: `specs/<feature>/tasks.md`

Tasks are organised by user story, with explicit file paths, and marked `[P]` when they can run in parallel. Each phase is independently testable — US1 (auth) is fully working before US2 (feed) starts.

```
Phase 1 — Setup
- [X] T001 Create project structure per implementation plan
- [X] T002 Install and configure dependencies

Phase 2 — Foundation
- [X] T003 Configure AntdRegistry in app/layout.tsx
- [X] T004 [P] Create API client in lib/api/client.ts
- [X] T005 [P] Define all API types in lib/types/api.ts

Phase 3 — US1: Authentication
- [X] T006 [US1] Implement AuthContext in lib/auth/context.tsx
- [X] T007 [P] [US1] Build LoginForm in components/auth/LoginForm.tsx
...

Phase 6 — US4: Comments
- [X] T027 [US4] Build CommentPanel in components/photos/CommentPanel.tsx
- [X] T028 [US4] Build photo detail page app/(main)/photos/[photoId]/page.tsx
```

---

#### `/speckit.implement` — Execute the Tasks

**Input**: `tasks.md` + all planning artifacts
**Output**: Working code; tasks checked off `[X]` as they complete

The command processes phases in order, respects dependencies, and marks each task complete in `tasks.md`. The user called this command with a targeted scope:

```
complete the mvp version for me first.
```

Then iterated per story: "continue with US2", "implement US3 and US4".

---

### Iterative Refinement

After the initial implementation, discovered issues were resolved through direct conversation with Claude Code — no re-planning needed:

| Observation | Fix |
|---|---|
| Page background black below content in light mode | Added `html { background: var(--bg-page) }` and `style={{ minHeight: "100vh" }}` on `<Layout>` to prevent viewport bleed |
| Nav header colour inconsistent (dark navy) | Added `components.Layout.headerBg` token to `ThemeProvider`; removed hardcoded Tailwind colour classes |
| Google OAuth popup getting 404 | Created `/auth/callback` matching the backend's redirect URI; switched from JSON body to query-param token reading |
| Refresh API called on every page reload | Replaced proactive refresh with lazy interceptor-only strategy; `AuthProvider` mount effect now only reads `localStorage` |
| User name and email missing from account menu | Decoded JWT payload client-side (`lib/utils/jwt.ts`) to extract `sub`, `name`, and `email` claims |

### Why This Workflow Works

**Specification before code** forces clarity on scope, edge cases, and acceptance criteria before any implementation decision. The AI and the developer both know *what* to build before debating *how*.

**Documented decisions** in `research.md` make architectural choices explicit and auditable. When requirements change mid-implementation, the rationale for each existing decision is on record.

**User-story phases** let each increment be a demonstrable, independently testable slice. US1 (auth shell) was fully working before the feed was started — the project was always in a shippable state.

**Iterative conversation** handles the details that are easier to discover by running the app than to plan ahead — visual inconsistencies, OAuth redirect URIs, API response shapes that differ from the spec.
