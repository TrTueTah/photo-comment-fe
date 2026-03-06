# Feature Specification: Photo Comment Web Application

**Feature Branch**: `001-photo-comment-web`
**Created**: 2026-03-06
**Status**: Draft
**Input**: Photo upload and comment web application — users can register/login, upload photos, browse a feed of all photos, and post comments on individual photos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account Access (Priority: P1)

A new visitor arrives at the application and needs to create an account before
doing anything else. An existing user needs to sign in to regain access. Both
flows lead to the same authenticated home experience. Users may also sign in
with their Google account; if they previously registered with the same email
via password, the accounts are merged automatically — they are never asked to
create a second account.

**Why this priority**: Authentication is the gateway to all other features.
Nothing else is usable without a valid session. An MVP that cannot handle
sign-up and sign-in is not demonstrable.

**Independent Test**: Open the app unauthenticated, register a new account,
and verify the user lands on the photo feed without any further prompts. Then
sign out and sign back in; the same feed is visible. This story delivers a
working auth shell independently of photo upload or commenting.

**Acceptance Scenarios**:

1. **Given** a visitor is not logged in, **When** they submit the registration
   form with a valid email, name, and password, **Then** they are immediately
   signed in and taken to the photo feed — no separate login step required.
2. **Given** a registered user submits the login form with correct credentials,
   **When** the system validates them, **Then** the user is signed in and
   redirected to the photo feed.
3. **Given** a user clicks "Sign in with Google" and grants consent, **When**
   Google returns successfully, **Then** the user is signed in and taken to
   the photo feed; if their Google email matches an existing account, that
   account is used.
4. **Given** a signed-in user clicks "Sign out", **When** the action completes,
   **Then** their session is ended and they are returned to the login/register
   screen.
5. **Given** a user submits a registration form with an email that already
   exists, **When** the system responds, **Then** a clear error is shown
   explaining the email is already registered — no account is created.
6. **Given** a user submits the login form with an incorrect password, **When**
   the system responds, **Then** a generic "invalid credentials" error is
   shown with no hint as to whether the email or password was wrong.
7. **Given** a user's session expires mid-use, **When** they perform any
   authenticated action, **Then** the session is silently renewed in the
   background; if renewal fails, they are redirected to the login screen.

---

### User Story 2 - Photo Feed (Priority: P2)

An authenticated user opens the application and sees all photos uploaded by
any user, displayed newest-first. Each photo shows the image, an optional
caption, the uploader's name, the upload date, and a count of how many
comments the photo has received. The feed gives users a full picture of all
shared content at a glance.

**Why this priority**: This is the core read experience of the application.
Every other feature (upload, comments) feeds into or out of this view. A
working feed is essential to demonstrate value even before upload or
commenting is built.

**Independent Test**: With at least one photo seeded in the backend, load
the feed as an authenticated user and verify all photos appear with their
metadata and comment counts. This can be tested independently of the upload
or comment flows.

**Acceptance Scenarios**:

1. **Given** an authenticated user opens the app, **When** photos exist in the
   system, **Then** all photos are displayed newest-first with image, caption
   (or blank if none), uploader name, upload date, and comment count.
2. **Given** an authenticated user opens the app, **When** no photos have been
   uploaded yet, **Then** an empty-state message is displayed (e.g.,
   "No photos yet — be the first to upload!").
3. **Given** a photo has zero comments, **When** it appears in the feed,
   **Then** the comment count shows "0" (not blank or hidden).
4. **Given** the user is viewing the feed, **When** the page loads, **Then**
   each photo image is displayed clearly and the page is fully readable on
   both desktop and mobile-width screens.

---

### User Story 3 - Photo Upload (Priority: P3)

An authenticated user wants to share a photo. They select an image file from
their device, optionally add a caption, and submit. The photo then appears at
the top of the feed for all users. The upload process gives the user clear
feedback at each stage — selecting the file, uploading it, and confirming it
was saved.

**Why this priority**: Upload is the primary content-creation action. Without
it the platform has no content, but the feed (P2) can still be demonstrated
with backend-seeded data, making upload P3.

**Independent Test**: Upload a new photo with a caption as an authenticated
user, then verify it immediately appears at the top of the feed with the
correct caption and uploader name.

**Acceptance Scenarios**:

1. **Given** an authenticated user selects an image file (JPEG, PNG, GIF, or
   WebP) of 10 MB or less, **When** they submit the upload form, **Then** a
   progress or loading indicator is shown during the upload, and on success
   the new photo appears at the top of the feed.
2. **Given** a user selects a file that is not an image (e.g., a PDF or video),
   **When** the file is selected, **Then** a validation error is shown before
   any upload attempt, and the file is rejected.
3. **Given** a user selects an image larger than 10 MB, **When** the file is
   selected, **Then** a validation error is shown stating the file is too
   large, and the upload is blocked.
4. **Given** an upload is in progress, **When** the upload completes
   successfully, **Then** the feed is updated to show the new photo at the
   top without requiring a full page reload.
5. **Given** an upload fails (e.g., network error), **When** the failure
   occurs, **Then** a clear error message is shown and the user can retry
   without losing their caption text.
6. **Given** a user submits the upload form without selecting a file, **When**
   they attempt to submit, **Then** a validation error prompts them to select
   a file.

---

### User Story 4 - Photo Comments (Priority: P4)

An authenticated user taps or clicks on a photo in the feed and is shown all
comments for that photo in chronological order (oldest first). They can type
a new comment and submit it. The new comment immediately appears in the
thread without a full page reload.

**Why this priority**: Commenting is a secondary interaction that adds social
value on top of the photo feed. It depends on at least one photo existing but
is otherwise independent of the upload flow.

**Independent Test**: With a seeded photo in the backend, navigate to that
photo's comment view, verify existing comments appear oldest-first, post a
new comment, and verify it appears immediately at the bottom of the thread.

**Acceptance Scenarios**:

1. **Given** an authenticated user selects a photo from the feed, **When** the
   comment view opens, **Then** all existing comments are shown oldest-first
   with commenter name, comment text, and timestamp.
2. **Given** a photo has no comments, **When** the comment view opens,
   **Then** an empty-state message is shown (e.g., "No comments yet — be
   the first!").
3. **Given** a user types a valid comment (1–2000 characters, not
   whitespace-only) and submits it, **When** submission succeeds, **Then**
   the new comment appears at the bottom of the thread and the comment input
   is cleared.
4. **Given** a user submits an empty or whitespace-only comment, **When**
   they attempt to submit, **Then** a validation error is shown and no network
   request is made.
5. **Given** a user types a comment exceeding 2000 characters, **When** they
   attempt to submit, **Then** a validation error indicates the comment is
   too long.
6. **Given** a comment submission fails due to a network error, **When** the
   error occurs, **Then** a clear error message is shown and the draft comment
   text is preserved so the user can retry.

---

### Edge Cases

- What happens when the user's session expires exactly while an upload is in
  progress? The system MUST attempt silent session renewal; if renewal fails,
  the upload MUST be interrupted gracefully with an informative message rather
  than a silent failure.
- What if the image upload to storage succeeds but the subsequent record
  confirmation step fails? The user MUST be informed of the failure; a broken
  record MUST NOT appear in the feed.
- What if a photo's image URL is temporarily unavailable? The feed MUST
  display a placeholder rather than a broken image icon.
- What happens when the feed contains a large number of photos? The page MUST
  remain responsive; visible images MUST not block the rest of the page
  from loading.
- What if a user with a Google-only account tries to log in via the
  email/password form? The backend's "invalid credentials" response MUST be
  displayed as a readable error — the form MUST NOT crash or show a blank
  screen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST prevent unauthenticated users from accessing
  any page other than login and registration.
- **FR-002**: The application MUST allow users to register with a unique email
  address, a display name, and a password of at least 8 characters.
- **FR-003**: The application MUST allow users to sign in with email and
  password.
- **FR-004**: The application MUST support "Sign in with Google"; users whose
  Google email matches an existing account MUST be signed into that existing
  account without creating a duplicate.
- **FR-005**: The application MUST allow signed-in users to sign out, clearing
  their session so subsequent pages require re-authentication.
- **FR-006**: The application MUST silently renew a user's session in the
  background when it expires; if renewal fails the user MUST be redirected to
  the login screen.
- **FR-007**: The application MUST display all uploaded photos in a feed sorted
  newest-first, each showing: photo image, caption (if any), uploader name,
  upload date/time, and comment count.
- **FR-008**: The application MUST allow authenticated users to upload an image
  file (JPEG, PNG, GIF, or WebP) with an optional caption of up to 500
  characters.
- **FR-009**: The application MUST reject file uploads where the file is not
  one of the accepted image types before any upload attempt occurs.
- **FR-010**: The application MUST reject file uploads where the file size
  exceeds 10 MB before any upload attempt occurs.
- **FR-011**: The application MUST show a clear progress or loading indicator
  during an active upload.
- **FR-012**: Upon successful upload, the new photo MUST appear at the top of
  the feed without requiring a full page reload.
- **FR-013**: The application MUST allow authenticated users to view all
  comments on a photo, ordered oldest-first, showing commenter name, comment
  text, and timestamp.
- **FR-014**: The application MUST allow authenticated users to post a comment
  on any photo; the comment MUST be 1–2000 characters and MUST NOT be
  whitespace-only.
- **FR-015**: After a comment is successfully posted, it MUST appear in the
  thread immediately without a full page reload, and the comment input MUST
  be cleared.
- **FR-016**: The application MUST display user-facing error messages in plain
  language for all failure states (validation errors, network failures,
  session expiry) — no raw error codes or stack traces MUST ever be shown to
  the user.

### Key Entities

- **User**: A person with a display name and email. Can be created via
  email/password registration or Google OAuth. When the same email is used
  in both methods, it maps to a single identity.
- **Photo**: An image shared by a user, with an optional caption, the
  uploader's identity, a creation timestamp, and a publicly accessible image
  URL. Each photo belongs to exactly one user.
- **Comment**: A text post by a user on a specific photo. Contains a body of
  1–2000 characters, the author's identity, and a creation timestamp. Each
  comment belongs to exactly one photo and one user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can register, upload a photo, and post a comment in
  under 3 minutes from first page load on a standard broadband connection.
- **SC-002**: All photos in the feed load and display within 3 seconds on a
  standard broadband connection.
- **SC-003**: All three core actions — upload photo, post comment, view feed —
  are completable end-to-end without encountering an unhandled error.
- **SC-004**: Every user-facing error state (invalid file type, file too large,
  empty comment, login failure, session expiry) produces a readable,
  actionable message; zero cases result in a blank screen, infinite spinner,
  or raw technical error output.
- **SC-005**: Session expiry during normal browsing is transparent — users are
  never unexpectedly redirected to login unless the session truly cannot be
  renewed.
- **SC-006**: The application is fully usable on screen widths from 375 px
  (mobile) through 1440 px (desktop) without horizontal scrolling or
  overlapping elements.

## Assumptions

- The backend API is fully implemented and available at a configurable base
  URL. The frontend does not need to handle partial backend availability
  beyond displaying standard error messages.
- Image files do not need to be stored persistently for the demo. The upload
  flow must be functional, but images may disappear after a server restart —
  this is acceptable per the assignment brief.
- No pagination is required. All photos and all comments for a photo are
  fetched in a single request per the current API design.
- There is no admin role, no photo deletion, and no comment deletion in scope
  for this version.
- A user may comment on their own photos.
- Comments on a photo are accessed from the feed (e.g., by clicking or
  expanding a photo card); a separate deep-link URL for a single photo is not
  required but is acceptable.
