# Quickstart: Photo Comment Web Application

**Feature**: `001-photo-comment-web`
**Date**: 2026-03-06

---

## Prerequisites

- Node.js 20+ and npm installed
- Backend (`photo-comment-be`) running on port 3001 (or your chosen port)
- AWS S3 bucket configured on the backend (handled by BE team)

---

## 1. Install Dependencies

```bash
cd photo-comment-fe
npm install
```

Key packages added for this feature:

```bash
npm install antd @ant-design/nextjs-registry
```

---

## 2. Configure Environment

Create `.env.local` in the project root (never commit this file):

```env
# Backend API base URL — change port if BE runs elsewhere
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 3. Start the Development Server

```bash
# Terminal 1: Start the backend
cd ../photo-comment-be
pnpm run start:dev

# Terminal 2: Start the frontend
cd ../photo-comment-fe
npm run dev
```

Frontend is available at: **http://localhost:3000**

---

## 4. Validate the Application

Work through each user story end-to-end:

### User Story 1 — Account Access

1. Open **http://localhost:3000** in a browser.
2. You should be redirected to `/login` automatically (unauthenticated).
3. Click "Register" and create a new account (email, name, password ≥ 8 chars).
4. Verify you are taken to the photo feed immediately after registration.
5. Click "Sign out" — verify redirect to `/login`.
6. Log back in with the same credentials — verify you reach the feed.
7. *(Optional)* Click "Sign in with Google" — verify the popup opens and you
   are signed in after consent.

### User Story 2 — Photo Feed

1. Log in as a registered user.
2. With no photos uploaded, verify the feed shows an empty-state message.
3. *(After upload)* Verify photos appear newest-first with image, caption,
   uploader name, date, and comment count.
4. Resize the browser window to 375 px width — verify the feed is usable
   without horizontal scrolling.

### User Story 3 — Photo Upload

1. Log in and navigate to the feed.
2. Click "Upload Photo".
3. Select an image file (JPEG/PNG/GIF/WebP, ≤ 10 MB).
4. Add a caption (optional).
5. Submit — verify a loading indicator appears.
6. After success, verify the new photo appears at the top of the feed.
7. Attempt to upload a PDF or video file — verify rejection with an error
   message before any upload starts.
8. Attempt to upload an image > 10 MB — verify rejection with a size error.

### User Story 4 — Photo Comments

1. Click on any photo in the feed to open its detail/comment view.
2. Verify existing comments appear oldest-first (or empty state if none).
3. Type a comment and submit — verify it appears immediately in the thread
   and the input is cleared.
4. Attempt to submit an empty comment — verify the error message without
   a network request.
5. Attempt to submit a comment of > 2000 characters — verify the length
   error message.

---

## 5. Lint Check

Before considering any feature complete:

```bash
npm run lint
```

Must report **0 errors** and **0 warnings** (unless warnings are pre-existing
from the scaffold).

---

## 6. Build Check

```bash
npm run build
```

Must complete with no TypeScript or build errors before the feature is
considered submission-ready.
