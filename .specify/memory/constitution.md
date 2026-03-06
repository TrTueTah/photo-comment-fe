<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0  (initial ratification)
Modified principles: N/A (first version)
Added sections:
  - Core Principles (5 principles)
  - Tech Stack Constraints
  - Development Workflow
  - Governance
Templates reviewed:
  - .specify/templates/plan-template.md       ✅ aligned (Constitution Check section present)
  - .specify/templates/spec-template.md       ✅ aligned (functional requirements + user stories structure matches)
  - .specify/templates/tasks-template.md      ✅ aligned (no test-mandatory language; tests marked OPTIONAL)
Deferred TODOs: none
-->

# Photo Comment Frontend Constitution

## Core Principles

### I. App Router & Server Components First

All pages and layouts MUST use the Next.js App Router (`app/` directory).
Components MUST default to React Server Components (RSC). Client Components
(`"use client"`) are permitted ONLY when strictly required: event handlers,
browser APIs, or stateful interactivity. Any Client Component boundary MUST
be pushed as far down the component tree as possible to maximise server
rendering.

**Rationale**: The assignment targets Next.js; RSC-first is the canonical
App Router pattern and reduces client-side bundle size.

### II. Ant Design as the Exclusive UI Component Library

All interactive and presentational UI MUST be built with Ant Design (`antd`)
components. No secondary component library MAY be introduced. Tailwind CSS
utility classes MAY be used for layout spacing and minor cosmetic adjustments
that Ant Design does not cover, but MUST NOT duplicate or override Ant Design
component internals. Custom CSS modules are permitted only for page-level
layout structure.

**Rationale**: The take-home assignment explicitly mandates Ant Design as the
UI library.

### III. TypeScript Strict Typing (NON-NEGOTIABLE)

All source files MUST be TypeScript (`.ts` / `.tsx`). The `any` type is
FORBIDDEN except when wrapping third-party library boundaries where no type
definition exists, in which case the usage MUST be commented with a reason.
Every API response shape, component prop, and state object MUST have an
explicit interface or type alias defined in a co-located or shared `types/`
file.

**Rationale**: The assignment requires TypeScript; strict typing prevents
runtime errors and makes the codebase reviewable by the assessor.

### IV. API-Driven Data Layer with Explicit Loading and Error States

All communication with the backend MUST go through a typed service layer
(e.g., `lib/api/` or `services/`). Direct `fetch` calls inside components
are FORBIDDEN. Every async operation that renders data MUST handle three
states explicitly: loading, success, and error. Loading and error feedback
MUST be visible to the user using Ant Design feedback components (`Spin`,
`Alert`, `message`, etc.).

**Rationale**: Clean separation of concerns; assessors evaluate both FE
architecture and UX robustness.

### V. Functional Simplicity — YAGNI

The implementation MUST cover exactly what the spec requires: photo upload,
comment submission, and photo+comment display. No feature, abstraction, or
configuration option MAY be added beyond what the specification demands.
Premature abstractions, generic utilities for one-time use, and
backwards-compatibility shims are FORBIDDEN. Code complexity MUST be
justified by an actual current requirement, not a hypothetical future one.

**Rationale**: This is a time-boxed take-home assignment assessed on clarity
and correctness, not scope or generality.

## Tech Stack Constraints

- **Framework**: Next.js 16, App Router only — no `pages/` directory usage.
- **Language**: TypeScript 5 — strict mode enabled in `tsconfig.json`.
- **UI Library**: Ant Design (latest compatible with React 19).
- **Styling**: Tailwind CSS v4 for layout/spacing utilities; Ant Design
  theming for component appearance.
- **Linting**: ESLint 9 with `eslint-config-next` (core-web-vitals +
  TypeScript rules). All lint errors MUST be resolved before a feature is
  considered complete.
- **Package manager**: npm (as per existing project setup).
- **Runtime**: Node.js compatible with Next.js 16.
- **No test framework** is configured; tests are NOT required for this
  assignment unless explicitly added.

## Development Workflow

- **Branch strategy**: Work on `main` for this solo assignment; feature
  branches are encouraged but not mandated.
- **Environment variables**: Backend API base URL MUST be stored in
  `.env.local` (`NEXT_PUBLIC_API_URL`). Hardcoded URLs in source code are
  FORBIDDEN.
- **Image handling**: Images do not need to be persisted server-side (per
  assignment notes). Upload functionality MUST be demonstrable; a working
  upload flow to the backend is sufficient.
- **Code review**: Not applicable for solo work; self-review against
  acceptance criteria in `spec.md` before marking a feature done.
- **Lint gate**: `npm run lint` MUST pass with zero errors before submission.
- **No breaking changes**: Since this is a single-developer project with no
  downstream consumers, version bumping of application code is not required.

## Governance

This constitution supersedes all informal coding conventions for the
`photo-comment-fe` project. Any amendment MUST:

1. Update this file with an incremented semantic version.
2. Add an entry in the Sync Impact Report comment block at the top.
3. Update `LAST_AMENDED_DATE` to the date of the change.
4. Review all `.specify/templates/` files for consistency and mark them
   updated or pending in the report.

Version bumping rules:
- **MAJOR**: Removal or redefinition of an existing principle.
- **MINOR**: New principle or section added.
- **PATCH**: Wording clarification, typo fix, non-semantic refinement.

All feature specs (`spec.md`), plans (`plan.md`), and task lists
(`tasks.md`) generated under this constitution MUST reference version
`1.0.0` or higher and comply with all five Core Principles.

**Version**: 1.0.0 | **Ratified**: 2026-03-06 | **Last Amended**: 2026-03-06
