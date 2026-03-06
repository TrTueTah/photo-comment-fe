# Implementation Plan: Photo Comment Web Application

**Branch**: `001-photo-comment-web` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-photo-comment-web/spec.md`

## Summary

Build a Next.js 16 App Router web application where authenticated users can
register/login (email+password and Google OAuth), browse a photo feed
(newest-first), upload photos directly to S3 via presigned URLs, and post
comments on individual photos. All UI uses Ant Design v5; all data access
goes through a typed service layer; tokens are managed with a refresh
interceptor.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20+
**Primary Dependencies**: Next.js 16, React 19, Ant Design v5,
`@ant-design/nextjs-registry`, Tailwind CSS v4
**Storage**: N/A (frontend only — backend handles S3 and PostgreSQL)
**Testing**: None configured (not required per constitution)
**Target Platform**: Web browser (desktop + mobile, 375 px – 1440 px)
**Project Type**: Web application (Next.js App Router, SSR + client-side)
**Performance Goals**: Feed load < 3 s on broadband; complete new-user flow
(register → upload → comment) < 3 min
**Constraints**: Responsive 375 px+; no `pages/` directory; no hardcoded
API URLs; `npm run lint` must pass with zero errors
**Scale/Scope**: Single developer, take-home assignment; ~4 pages, ~3 service
modules, ~8 components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. App Router & RSC First | All pages in `app/`; `"use client"` only for interactive components (forms, feed state, upload, comment input) | ✅ PASS |
| II. Ant Design Exclusive | All UI via `antd` components; no secondary component library | ✅ PASS |
| III. TypeScript Strict | All files `.ts`/`.tsx`; all API shapes typed in `lib/types/api.ts`; no `any` | ✅ PASS |
| IV. API-Driven Data Layer | All API calls in `lib/api/`; `apiFetch` wrapper handles token refresh; explicit loading/error/success states everywhere | ✅ PASS |
| V. YAGNI | Implements exactly what spec requires; no pagination, no delete, no admin, no extra abstractions | ✅ PASS |

**Post-Phase 1 re-check**: All gates still pass. Complexity Tracking not
required — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-photo-comment-web/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api-service-contract.md  # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/
├── (auth)/                     # Public route group — no nav bar
│   ├── login/
│   │   └── page.tsx            # Login page (email/password + Google button)
│   └── register/
│       └── page.tsx            # Registration page
├── (main)/                     # Protected route group — with nav bar
│   ├── layout.tsx              # Protected layout with nav bar + ProtectedGuard
│   ├── feed/
│   │   └── page.tsx            # Photo feed (home)
│   └── photos/
│       └── [photoId]/
│           └── page.tsx        # Single photo detail + comments
├── auth/
│   └── google/
│       └── callback/
│           └── page.tsx        # Google OAuth popup callback
├── layout.tsx                  # Root layout (AntdRegistry + AuthProvider)
└── globals.css

lib/
├── api/
│   ├── client.ts               # apiFetch / publicFetch / token management
│   ├── auth.ts                 # Auth API calls
│   ├── photos.ts               # Photos API calls (incl. S3 orchestration)
│   └── comments.ts             # Comments API calls
├── auth/
│   └── context.tsx             # AuthContext + AuthProvider (Client Component)
└── types/
    ├── api.ts                  # API DTO interfaces (from data-model.md)
    └── app.ts                  # Client-only state shapes

components/
├── auth/
│   ├── LoginForm.tsx           # Ant Design Form, email+password fields
│   └── RegisterForm.tsx        # Ant Design Form, email+name+password fields
├── photos/
│   ├── PhotoFeed.tsx           # Feed list with Ant Design List/Card
│   ├── PhotoCard.tsx           # Single photo card (image, caption, metadata)
│   ├── UploadModal.tsx         # Ant Design Modal with Upload + Form
│   └── CommentPanel.tsx        # Comment list + post-comment form
└── shared/
    └── AppNav.tsx              # Top nav bar (logo, upload button, user menu)

.env.local                      # NEXT_PUBLIC_API_URL (not committed)
```

**Structure Decision**: Next.js App Router with route groups `(auth)` and
`(main)`. Service layer isolated in `lib/api/`. Shared types in `lib/types/`.
UI components co-located by domain in `components/`. This follows the
canonical Next.js App Router layout and satisfies all five constitution
principles.
