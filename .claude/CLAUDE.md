# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is the frontend of a photo-commenting application. The full project lives at `../` with two sibling directories:
- `photo-comment-fe/` — this Next.js frontend (current repo)
- `photo-comment-be/` — NestJS backend

## Commands

```bash
# Development
npm run dev       # Start dev server at http://localhost:3000

# Build & production
npm run build
npm run start

# Lint
npm run lint      # Runs eslint (no autofix)
```

No test framework is configured yet in this project.

## Tech Stack

- **Next.js 16** with the App Router (`app/` directory)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **ESLint 9** with `eslint-config-next` (core-web-vitals + typescript rules)

## Architecture

This project uses the Next.js App Router. All routes and layouts live under `app/`:
- `app/layout.tsx` — root layout with Geist font variables applied to `<body>`
- `app/page.tsx` — home page (currently the default scaffold)
- `app/globals.css` — global styles

Styling uses Tailwind CSS utility classes directly in JSX. Dark mode is supported via Tailwind's `dark:` variant.

## Backend

The companion backend (`../photo-comment-be`) is a NestJS 11 app using pnpm. To run it:

```bash
cd ../photo-comment-be
pnpm run start:dev   # Watch mode on default NestJS port (3000 — change one if running both)
```
