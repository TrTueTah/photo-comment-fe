# API Service Contract: Photo Comment Web Application

**Feature**: `001-photo-comment-web`
**Date**: 2026-03-06
**Source**: `api-handoff.md` + `research.md` decisions

This document defines the TypeScript function signatures for every function
in the service layer (`lib/api/`). Components MUST call only these functions —
never `fetch` directly.

---

## Base Client (`lib/api/client.ts`)

```typescript
/**
 * Authenticated fetch wrapper.
 *
 * - Attaches Authorization: Bearer <accessToken> to every call.
 * - On 401: attempts one token refresh, then retries once.
 * - On refresh failure: calls onSessionExpired() and throws.
 * - Queues concurrent requests while refresh is in-flight.
 *
 * Throws ApiError on non-2xx responses.
 */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T>

/**
 * Unauthenticated fetch wrapper for public endpoints.
 * Throws ApiError on non-2xx responses.
 */
export async function publicFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T>

/**
 * Register a callback invoked when session renewal fails.
 * Typically sets auth state to null and redirects to /login.
 */
export function setSessionExpiredHandler(handler: () => void): void

/**
 * Set the active tokens for all subsequent apiFetch calls.
 */
export function setTokens(accessToken: string, refreshToken: string): void

/**
 * Clear all stored tokens (called on logout).
 */
export function clearTokens(): void
```

---

## Auth Service (`lib/api/auth.ts`)

```typescript
import type {
  TokenPair,
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
} from '../types/api'

/**
 * Register a new account.
 *
 * Endpoint: POST /auth/register
 * Auth: Public
 *
 * @throws ApiError 400 — validation failure (message is string[])
 * @throws ApiError 409 — email already registered
 */
export async function register(data: RegisterRequest): Promise<TokenPair>

/**
 * Sign in with email and password.
 *
 * Endpoint: POST /auth/login
 * Auth: Public
 *
 * @throws ApiError 401 — invalid credentials (intentionally vague)
 */
export async function login(data: LoginRequest): Promise<TokenPair>

/**
 * Exchange a refresh token for a new token pair (rotation).
 *
 * Endpoint: POST /auth/refresh
 * Auth: Public (refresh token is the credential)
 *
 * @throws ApiError 401 — refresh token expired, malformed, or missing
 */
export async function refreshTokens(data: RefreshRequest): Promise<TokenPair>

/**
 * End session (client-side cleanup only — backend is stateless).
 *
 * Endpoint: POST /auth/logout
 * Auth: Required
 *
 * Note: Caller MUST discard both tokens regardless of response.
 */
export async function logout(): Promise<void>

/**
 * Returns the URL to navigate to for initiating Google OAuth.
 * Caller MUST open this in a popup (window.open), NOT via fetch.
 *
 * Endpoint: GET /auth/google (browser redirect, no JSON)
 *
 * Usage:
 *   const popup = window.open(getGoogleAuthUrl(), 'google-auth', 'width=500,height=600')
 */
export function getGoogleAuthUrl(): string
```

---

## Photos Service (`lib/api/photos.ts`)

```typescript
import type {
  PhotoFeedItem,
  PhotoDetail,
  PresignResponse,
  ConfirmPhotoRequest,
} from '../types/api'

/**
 * Fetch all photos, newest first, with comment counts.
 *
 * Endpoint: GET /photos
 * Auth: Required
 *
 * @returns Empty array when no photos exist.
 * @throws ApiError 401 — session expired (handled by apiFetch interceptor)
 */
export async function getPhotos(): Promise<PhotoFeedItem[]>

/**
 * Upload a photo in a single orchestrated call (3 steps):
 *   1. POST /photos/presign — get presigned S3 URL
 *   2. PUT <presignedUrl>   — upload file bytes directly to S3
 *   3. POST /photos         — confirm upload and create DB record
 *
 * Auth: Required
 *
 * @param file    The image File object (already client-validated)
 * @param caption Optional caption (max 500 chars)
 * @returns       The newly created PhotoDetail record
 *
 * @throws ApiError 400/422 — presign validation failure
 * @throws ApiError 401     — session expired
 * @throws Error            — S3 PUT failed (non-200 from S3)
 */
export async function uploadPhoto(
  file: File,
  caption?: string,
): Promise<PhotoDetail>

/**
 * Request a presigned S3 upload URL.
 * (Internal helper — prefer uploadPhoto() for full flow.)
 *
 * Endpoint: POST /photos/presign
 * Auth: Required
 */
export async function presignUpload(
  filename: string,
  contentType: string,
): Promise<PresignResponse>

/**
 * PUT file bytes directly to S3 using a presigned URL.
 * (Internal helper — prefer uploadPhoto() for full flow.)
 *
 * IMPORTANT: Do NOT include Authorization header — S3 uses signed URL params.
 * The contentType MUST exactly match the value used in presignUpload().
 *
 * @throws Error if S3 returns non-200 (e.g., 403 for Content-Type mismatch)
 */
export async function putFileToS3(
  presignedUrl: string,
  file: File,
  contentType: string,
): Promise<void>

/**
 * Confirm upload and create photo record in DB.
 * (Internal helper — prefer uploadPhoto() for full flow.)
 *
 * Endpoint: POST /photos
 * Auth: Required
 *
 * MUST only be called after S3 PUT succeeds.
 */
export async function confirmPhoto(
  data: ConfirmPhotoRequest,
): Promise<PhotoDetail>
```

---

## Comments Service (`lib/api/comments.ts`)

```typescript
import type { Comment, PostCommentRequest } from '../types/api'

/**
 * Fetch all comments for a photo, oldest first.
 *
 * Endpoint: GET /photos/:photoId/comments
 * Auth: Required
 *
 * @returns Empty array when photo has no comments.
 * @throws ApiError 401 — session expired
 * @throws ApiError 404 — photoId does not exist
 */
export async function getComments(photoId: string): Promise<Comment[]>

/**
 * Post a comment on a photo.
 *
 * Endpoint: POST /photos/:photoId/comments
 * Auth: Required
 *
 * @param photoId  UUID of the target photo
 * @param data     Comment content (1–2000 chars, not whitespace-only;
 *                 validated client-side before calling this function)
 *
 * @throws ApiError 400 — content empty or exceeds 2000 chars
 * @throws ApiError 401 — session expired
 * @throws ApiError 404 — photoId does not exist
 */
export async function postComment(
  photoId: string,
  data: PostCommentRequest,
): Promise<Comment>
```

---

## Error Handling Contract

All service functions throw an `ApiError` (see `lib/types/api.ts`) on
non-2xx responses. The `message` field may be a `string` or `string[]`
(for validation errors from the backend).

**Helper** (`lib/api/client.ts`):

```typescript
/**
 * Extract a human-readable error string from an ApiError or unknown error.
 * Use in catch blocks to display to the user.
 */
export function formatApiError(error: unknown): string
```

**Usage pattern in components**:

```typescript
try {
  const photos = await getPhotos()
  setPhotos(photos)
} catch (err) {
  setError(formatApiError(err))
} finally {
  setLoading(false)
}
```

---

## Google OAuth Callback Contract (`app/auth/google/callback/page.tsx`)

```typescript
/**
 * This page is loaded in the Google OAuth popup.
 * It reads the JSON response from the server (tokens), posts them
 * back to the opener window, then closes itself.
 *
 * Expected server response shape at this URL: TokenPair
 *
 * postMessage payload:
 *   { type: 'GOOGLE_AUTH_SUCCESS', accessToken: string, refreshToken: string }
 *   { type: 'GOOGLE_AUTH_ERROR', message: string }
 *
 * The main window listens for window message events of type 'GOOGLE_AUTH_SUCCESS'
 * to complete the OAuth flow.
 */
```
