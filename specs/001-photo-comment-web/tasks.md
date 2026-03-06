---
description: "Task list for Photo Comment Web Application"
---

# Tasks: Photo Comment Web Application

**Input**: Design documents from `specs/001-photo-comment-web/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Not included — no test framework configured per constitution.

**Organization**: Tasks grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Each task includes exact file path(s)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies and configure the project for development.

- [X] T001 Install Ant Design dependencies: run `npm install antd @ant-design/nextjs-registry` in project root
- [X] T002 [P] Create `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:3001` (adjust port to match backend)
- [X] T003 [P] Verify `tsconfig.json` has `"strict": true` under `compilerOptions`; add it if missing

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure all user stories depend on. MUST complete
before any user story work begins.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Create API DTO type interfaces in `lib/types/api.ts` — copy all interfaces from `data-model.md` (TokenPair, RegisterRequest, LoginRequest, RefreshRequest, UserRef, PhotoFeedItem, PhotoDetail, PresignRequest, PresignResponse, ConfirmPhotoRequest, Comment, PostCommentRequest, ApiError)
- [X] T005 [P] Create client-only app state types in `lib/types/app.ts` — copy AuthState, AuthContextValue, UploadStatus, UploadState, ACCEPTED_IMAGE_TYPES, AcceptedImageType, MAX_FILE_SIZE_BYTES from `data-model.md`
- [X] T006 Implement base API client in `lib/api/client.ts` — `apiFetch` (with Authorization header + 401 → refresh → retry once + pending-request queue), `publicFetch` (no auth), `setTokens`, `clearTokens`, `setSessionExpiredHandler`, `formatApiError` (depends on T004, T005)
- [X] T007 Create `AuthContext` and `AuthProvider` in `lib/auth/context.tsx` — holds `{ user, accessToken, isLoading }` state; restores session from `localStorage` refresh token on mount; exposes `login`, `logout`, `refreshTokens`; calls `setTokens`/`clearTokens` on `lib/api/client.ts`; must be a `"use client"` component (depends on T004, T005, T006)
- [X] T008 Update `app/layout.tsx` — wrap `<body>` children with `<AntdRegistry>` (from `@ant-design/nextjs-registry`) then `<AuthProvider>`; import Geist font variables as before (depends on T007)
- [X] T009 Create `app/(main)/layout.tsx` — `"use client"` wrapper that reads `AuthContext`; redirects to `/login` if `user` is null and `isLoading` is false; renders children when authenticated (depends on T007)
- [X] T010 Update `app/page.tsx` — redirect to `/feed` using `next/navigation` `redirect()` (authenticated users land here from root)

**Checkpoint**: Foundation ready — run `npm run dev`, open `http://localhost:3000`, and confirm redirect to `/login` for unauthenticated visits.

---

## Phase 3: User Story 1 - Account Access (Priority: P1) 🎯 MVP

**Goal**: Users can register, log in (email/password + Google OAuth), and log
out. Session renewal happens silently in the background.

**Independent Test**: Register a new account → verify redirect to `/feed`.
Sign out → verify redirect to `/login`. Log back in → verify `/feed` is
accessible. App works as an auth-only shell even with no photos yet.

### Implementation for User Story 1

- [X] T011 [P] [US1] Implement auth service functions in `lib/api/auth.ts` — `register(data)`, `login(data)`, `refreshTokens(data)`, `logout()`, `getGoogleAuthUrl()` using `publicFetch` (register/login/refresh) and `apiFetch` (logout); all typed with interfaces from `lib/types/api.ts`
- [X] T012 [P] [US1] Create `RegisterForm` component in `components/auth/RegisterForm.tsx` — Ant Design `Form` with email, name, and password fields; client-side validation (email format, name 1–100 chars, password ≥ 8 chars); calls `register()` on submit; shows `Spin` during submission; shows `Alert` or `message.error` for API errors (email taken → readable message); on success calls `AuthContext.login()`; `"use client"` (depends on T004, T006, T011)
- [X] T013 [P] [US1] Create `LoginForm` component in `components/auth/LoginForm.tsx` — Ant Design `Form` with email and password fields; "Sign in with Google" `Button` that opens `window.open(getGoogleAuthUrl(), 'google-auth', 'width=500,height=600')` and listens for `window.addEventListener('message', ...)` with `{ type: 'GOOGLE_AUTH_SUCCESS' }`; calls `login()` on form submit; shows generic error on 401; on success calls `AuthContext.login()`; `"use client"` (depends on T004, T006, T011)
- [X] T014 [US1] Create Google OAuth popup callback page in `app/auth/google/callback/page.tsx` — `"use client"` page that on mount reads the JSON response from the server (tokens already in the page response from backend redirect), then posts `{ type: 'GOOGLE_AUTH_SUCCESS', accessToken, refreshToken }` to `window.opener` via `postMessage(payload, window.location.origin)` and calls `window.close()`; if tokens missing, posts `{ type: 'GOOGLE_AUTH_ERROR', message: '...' }` instead (depends on T004)
- [X] T015 [US1] Create login page in `app/(auth)/login/page.tsx` — renders `<LoginForm>` centered on screen using Ant Design `Card`; includes link to `/register`; no nav bar (auth route group) (depends on T013)
- [X] T016 [US1] Create register page in `app/(auth)/register/page.tsx` — renders `<RegisterForm>` centered on screen using Ant Design `Card`; includes link to `/login`; no nav bar (depends on T012)

**Checkpoint**: At this point User Story 1 is fully functional and independently testable. Auth shell is complete.

---

## Phase 4: User Story 2 - Photo Feed (Priority: P2)

**Goal**: Authenticated users see all photos newest-first with image, caption,
uploader name, date, and comment count. Empty state shown when no photos exist.

**Independent Test**: With at least one photo seeded on the backend, log in and
navigate to `/feed`; verify photo metadata is displayed correctly, including
`commentCount: 0` for new photos. Resize to 375 px width — no horizontal scroll.

### Implementation for User Story 2

- [X] T017 [P] [US2] Implement `getPhotos()` in `lib/api/photos.ts` — calls `GET /photos` via `apiFetch`; returns `PhotoFeedItem[]`; typed with `lib/types/api.ts` (depends on T004, T006)
- [X] T018 [P] [US2] Create `PhotoCard` component in `components/photos/PhotoCard.tsx` — accepts `PhotoFeedItem` prop; renders Ant Design `Card` with `Image` (with `fallback` prop for broken URL placeholder), caption (omitted if null), uploader name, formatted date, comment count badge; clickable — navigates to `/photos/[id]` via `next/link`; `"use client"` (depends on T004)
- [X] T019 [US2] Create `PhotoFeed` component in `components/photos/PhotoFeed.tsx` — `"use client"`; calls `getPhotos()` on mount; shows Ant Design `Spin` while loading; shows Ant Design `Alert` on error; shows Ant Design `Empty` component when array is empty; renders list of `<PhotoCard>` components; exposes `addPhoto(photo: PhotoFeedItem)` callback prop for upload integration (depends on T004, T006, T017, T018)
- [X] T020 [P] [US2] Create `AppNav` component in `components/shared/AppNav.tsx` — Ant Design `Layout.Header` with app title on left; user display name + logout `Dropdown` menu on right; calls `AuthContext.logout()` on sign-out click; `"use client"` (depends on T007)
- [X] T021 [US2] Update `app/(main)/layout.tsx` to render `<AppNav>` above `{children}` inside an Ant Design `Layout` (depends on T009, T020)
- [X] T022 [US2] Create photo feed page in `app/(main)/feed/page.tsx` — `"use client"`; renders `<PhotoFeed>`; acts as the home page for authenticated users (depends on T019, T021)

**Checkpoint**: At this point User Story 2 is fully functional. Authenticated users can view the photo feed independently of upload or comments.

---

## Phase 5: User Story 3 - Photo Upload (Priority: P3)

**Goal**: Authenticated users can upload a JPEG/PNG/GIF/WebP image (≤ 10 MB)
with an optional caption. Client-side validation runs before any network call.
A loading indicator shows during upload. On success the new photo appears at
the top of the feed without a page reload.

**Independent Test**: Click "Upload Photo", select a valid image, add a caption,
submit. Verify loading indicator appears, then the new photo is prepended to
the feed. Test rejection of a PDF and a file > 10 MB.

### Implementation for User Story 3

- [X] T023 [US3] Add upload service functions to `lib/api/photos.ts` — `presignUpload(filename, contentType)`, `putFileToS3(presignedUrl, file, contentType)` (plain `fetch` PUT, no Authorization header), `confirmPhoto(data)`, and `uploadPhoto(file, caption?)` orchestrator that runs all 3 steps sequentially and aborts on any failure; all typed (depends on T004, T006, T017)
- [X] T024 [US3] Create `UploadModal` component in `components/photos/UploadModal.tsx` — `"use client"` Ant Design `Modal`; contains Ant Design `Upload` (Dragger or standard) restricted to `image/jpeg,image/png,image/gif,image/webp`; client-side rejects files > 10 MB or wrong type before calling service; optional `Input` for caption (max 500 chars); `Button` triggers `uploadPhoto()`; shows `Spin` / `Progress` during upload stages (presigning → uploading → confirming); shows `Alert` or `message.error` on failure (preserves caption text); on success calls `onSuccess(photo)` prop callback and closes modal (depends on T004, T005, T023)
- [X] T025 [US3] Add "Upload Photo" `Button` to `AppNav` that opens `UploadModal` in `components/shared/AppNav.tsx`; pass `onSuccess` callback that calls a `onPhotoUploaded` prop from the layout (depends on T020, T024)
- [X] T026 [US3] Wire upload success to feed: update `app/(main)/feed/page.tsx` to pass `onPhotoUploaded` down to `AppNav` (via layout prop or shared state) that prepends the new `PhotoFeedItem` to the feed list in `<PhotoFeed>` (depends on T022, T025)

**Checkpoint**: At this point User Story 3 is fully functional. Upload flow works end-to-end independently.

---

## Phase 6: User Story 4 - Photo Comments (Priority: P4)

**Goal**: Authenticated users can click a photo to open its detail page, view
all comments oldest-first, and post new comments that appear immediately
without a page reload.

**Independent Test**: With a seeded photo, navigate to `/photos/<id>`, verify
comments appear oldest-first, post a comment, verify it appears at the bottom
and the input is cleared. Test empty comment rejection (no network request).

### Implementation for User Story 4

- [X] T027 [P] [US4] Implement `getComments(photoId)` and `postComment(photoId, data)` in `lib/api/comments.ts` — calls `GET /photos/:photoId/comments` and `POST /photos/:photoId/comments` via `apiFetch`; typed with `lib/types/api.ts`; `postComment` validates `photoId` is non-empty before calling (depends on T004, T006)
- [X] T028 [US4] Create `CommentPanel` component in `components/photos/CommentPanel.tsx` — `"use client"`; accepts `photoId: string` prop; calls `getComments()` on mount; shows Ant Design `Spin` while loading; shows Ant Design `Empty` when no comments; renders list of comments with author name, text, and formatted timestamp (Ant Design `Comment` or `List.Item`); includes Ant Design `Form` with `TextArea` (maxLength 2000) and submit `Button`; client-side rejects empty/whitespace-only input without a network call; on submit calls `postComment()`; appends returned comment to list and clears input; shows `Alert` on error (preserves draft text) (depends on T004, T006, T027)
- [X] T029 [US4] Create photo detail page in `app/(main)/photos/[photoId]/page.tsx` — `"use client"`; renders the photo image (full width), caption, and `<CommentPanel photoId={params.photoId} />`; includes a "← Back to feed" link to `/feed` (depends on T004, T018, T028)

**Checkpoint**: All four user stories are now independently functional.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final quality checks and improvements that span all stories.

- [ ] T030 Add `fallback` image placeholder to `PhotoCard` in `components/photos/PhotoCard.tsx` — set Ant Design `Image` `fallback` prop to a data URI or local placeholder asset so broken S3 URLs show a grey placeholder instead of a broken icon
- [ ] T031 Verify responsive layout: open the app in a browser at 375 px viewport width and confirm feed, photo detail, login, and register pages are fully usable without horizontal scrolling; fix any Tailwind utility overrides needed
- [ ] T032 [P] Run `npm run lint` and fix all reported ESLint errors across all new files (zero errors required before submission)
- [ ] T033 Run `npm run build` and resolve all TypeScript type errors and Next.js build warnings
- [ ] T034 [P] Self-review against `specs/001-photo-comment-web/quickstart.md` acceptance criteria — walk through each user story scenario and confirm every acceptance criterion passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup; BLOCKS all user story phases
- **User Story 1 — Account Access (Phase 3)**: Depends on Foundational
- **User Story 2 — Photo Feed (Phase 4)**: Depends on Foundational; can start after Phase 3 checkpoint
- **User Story 3 — Photo Upload (Phase 5)**: Depends on US2 (feed page must exist for upload integration)
- **User Story 4 — Photo Comments (Phase 6)**: Depends on Foundational; can start after Phase 4 checkpoint (needs PhotoCard link target)
- **Polish (Phase N)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only
- **US2 (P2)**: Depends on Foundational only (can run in parallel with US1 after Phase 2)
- **US3 (P3)**: Depends on US2 (upload prepends to feed; feed page must exist)
- **US4 (P4)**: Depends on Foundational + PhotoCard (T018) for clickable card link

### Within Each User Story

- Service functions (T011, T017, T023, T027) before components that call them
- Components before pages that render them
- Core implementation before integration with other stories

### Parallel Opportunities

- T002, T003 can run in parallel during Setup
- T004, T005 can run in parallel in Foundational
- T011, T012, T013 can run in parallel within US1
- T017, T018, T020 can run in parallel within US2
- T027 can run in parallel with T028 setup within US4
- T032, T034 can run in parallel during Polish

---

## Parallel Example: User Story 1

```bash
# Launch in parallel (different files, no cross-dependencies):
Task T011: "Implement auth service in lib/api/auth.ts"
Task T012: "Create RegisterForm in components/auth/RegisterForm.tsx"
Task T013: "Create LoginForm in components/auth/LoginForm.tsx"
Task T014: "Create OAuth callback page in app/auth/google/callback/page.tsx"

# Then sequentially:
Task T015: "Create login page in app/(auth)/login/page.tsx"  (needs T013)
Task T016: "Create register page in app/(auth)/register/page.tsx"  (needs T012)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Account Access)
4. **STOP and VALIDATE**: Register → land on feed → sign out → sign in → feed visible
5. Deploy/demo auth shell

### Incremental Delivery

1. Setup + Foundational → base ready
2. US1 (Account Access) → working auth, testable independently
3. US2 (Photo Feed) → photo grid visible with seeded data, testable independently
4. US3 (Photo Upload) → full create flow, testable independently
5. US4 (Photo Comments) → full social layer, testable independently
6. Polish → submission ready

### Parallel Team Strategy

With a single developer, the recommended order is priority order (P1 → P4),
completing each story to its checkpoint before starting the next.

---

## Notes

- `[P]` tasks = different files, no blocking dependencies — safe to run in parallel
- `[Story]` label maps each task to a specific user story for traceability
- Each user story is independently completable and testable at its Checkpoint
- All components that use `useState`, `useEffect`, `useContext`, or event
  handlers MUST include `"use client"` at the top of the file
- All service calls MUST go through `lib/api/client.ts` — never raw `fetch`
  inside components
- Commit after each phase checkpoint or logical group of tasks
- Run `npm run lint` after completing each user story phase
