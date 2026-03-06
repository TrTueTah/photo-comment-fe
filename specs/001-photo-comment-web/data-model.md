# Data Model: Photo Comment Web Application

**Feature**: `001-photo-comment-web`
**Date**: 2026-03-06
**Source**: api-handoff.md DTOs + spec.md Key Entities

---

## Frontend Data Model Overview

This document defines every TypeScript interface and type alias used by the
frontend. All types live in `lib/types/api.ts` (shared API DTOs) and
`lib/types/app.ts` (client-only app state shapes). No `any` types are used.

---

## API DTOs (`lib/types/api.ts`)

These interfaces map directly to the backend API response shapes documented
in `api-handoff.md`.

```typescript
// ─── Auth ────────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;   // JWT, short-lived (15 min)
  refreshToken: string;  // JWT, long-lived (7 days)
}

export interface RegisterRequest {
  email: string;   // valid email, max 254 chars
  name: string;    // 1–100 chars
  password: string; // min 8 chars
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface UserRef {
  id: string;   // UUID
  name: string;
}

// ─── Photos ──────────────────────────────────────────────────────────────────

export interface PhotoFeedItem {
  id: string;           // UUID
  url: string;          // Public S3 URL — use directly in <img src>
  caption: string | null;
  createdAt: string;    // ISO 8601 UTC
  uploader: UserRef;
  commentCount: number; // Integer >= 0
}

export interface PhotoDetail {
  id: string;
  url: string;
  caption: string | null;
  createdAt: string;
  uploader: UserRef;
  // note: no commentCount on creation response
}

export interface PresignRequest {
  filename: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
}

export interface PresignResponse {
  presignedUrl: string; // S3 presigned URL — PUT file here directly
  key: string;          // Store and send to POST /photos after S3 PUT
  expiresIn: number;    // Seconds (300)
}

export interface ConfirmPhotoRequest {
  key: string;
  caption?: string | null; // max 500 chars
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;        // UUID
  content: string;   // 1–2000 chars, not whitespace-only
  createdAt: string; // ISO 8601 UTC
  author: UserRef;
}

export interface PostCommentRequest {
  content: string; // 1–2000 chars
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  message: string | string[]; // array for validation errors
  error: string;              // HTTP status text
}
```

---

## App State Types (`lib/types/app.ts`)

Client-only shapes that are not sent to or received from the API.

```typescript
import type { UserRef, TokenPair } from './api';

// Auth context value
export interface AuthState {
  user: UserRef | null;       // null = not authenticated
  accessToken: string | null;
  isLoading: boolean;         // true while checking stored refresh token on init
}

export interface AuthContextValue extends AuthState {
  login: (tokens: TokenPair, user: UserRef) => void;
  logout: () => void;
  refreshTokens: () => Promise<boolean>; // false = refresh failed → must logout
}

// Upload state machine
export type UploadStatus =
  | 'idle'
  | 'validating'
  | 'presigning'
  | 'uploading'
  | 'confirming'
  | 'success'
  | 'error';

export interface UploadState {
  status: UploadStatus;
  progress: number;       // 0–100 (for future XHR progress; 0 or 100 with fetch)
  errorMessage: string | null;
}

// Accepted image MIME types (client-side validation)
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export type AcceptedImageType = typeof ACCEPTED_IMAGE_TYPES[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
```

---

## Entity Relationships

```
User ─────────────── uploads many ──────────────► Photo
  │                                                 │
  └─────────────── authors many ──────────────► Comment
                                                    │
Photo ─────────────── has many ─────────────────► Comment
```

**Constraints (enforced client-side before API calls)**:

| Entity | Field | Constraint |
|--------|-------|------------|
| User | email | Valid email format, max 254 chars |
| User | name | 1–100 chars |
| User | password | Min 8 chars (registration only) |
| Photo | caption | Optional, max 500 chars |
| Photo | file type | One of: image/jpeg, image/png, image/gif, image/webp |
| Photo | file size | Max 10 MB |
| Comment | content | 1–2000 chars, not whitespace-only |

---

## State Transitions

### Upload Flow

```
idle
  │  user selects file
  ▼
validating ── invalid type/size ──► idle (show error)
  │
  │  file passes validation
  ▼
presigning ── API error ──► error (show error, allow retry)
  │
  │  presign success
  ▼
uploading ── S3 error ──► error (show error, allow retry)
  │
  │  S3 PUT 200
  ▼
confirming ── API error ──► error (show error, allow retry)
  │
  │  confirm success
  ▼
success ──────────────────► idle (reset form, update feed)
```

### Auth Flow

```
init
  │  check localStorage for refreshToken
  ├── no token ──► unauthenticated (redirect to /login)
  └── token found ──► call POST /auth/refresh
        ├── success ──► authenticated (restore user session)
        └── failure ──► unauthenticated (redirect to /login)

authenticated
  │  access token expires (401 on any request)
  ├── call POST /auth/refresh
  │     ├── success ──► retry original request, stay authenticated
  │     └── failure ──► unauthenticated (redirect to /login)
  └── user clicks logout
        └── clear tokens ──► unauthenticated (redirect to /login)
```
