// ─── Auth ────────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string; // JWT, short-lived (15 min)
  refreshToken: string; // JWT, long-lived (7 days)
}

export interface RegisterRequest {
  email: string; // valid email, max 254 chars
  name: string; // 1–100 chars
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
  id: string; // UUID
  name: string;
  email?: string; // present for the authenticated user, absent for other users
}

// ─── Photos ──────────────────────────────────────────────────────────────────

// Unified photo shape returned by GET /photos, GET /photos/:id, and POST /photos.
// commentCount is absent on POST /photos (always 0 at creation — default client-side).
export interface PhotoItem {
  id: string; // UUID
  url: string; // Public S3 URL
  caption: string | null;
  createdAt: string; // ISO 8601 UTC
  uploader: UserRef;
  commentCount?: number; // absent on POST /photos response; present on GET
}

export interface PresignRequest {
  filename: string;
  contentType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
}

export interface PresignResponse {
  presignedUrl: string;
  key: string;
  expiresIn: number; // seconds (300)
}

export interface ConfirmPhotoRequest {
  key: string;
  caption?: string | null; // max 500 chars
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface Comment {
  id: string; // UUID
  content: string; // 1–2000 chars, not whitespace-only
  createdAt: string; // ISO 8601 UTC
  author: UserRef;
}

export interface PostCommentRequest {
  content: string; // 1–2000 chars
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}
