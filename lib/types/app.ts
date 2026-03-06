import type { UserRef, TokenPair } from "./api";

// Auth context value
export interface AuthState {
  user: UserRef | null; // null = not authenticated
  accessToken: string | null;
  isLoading: boolean; // true while checking stored refresh token on init
}

export interface AuthContextValue extends AuthState {
  login: (tokens: TokenPair, user: UserRef) => void;
  logout: () => void;
}

// Upload state machine
export type UploadStatus =
  | "idle"
  | "validating"
  | "presigning"
  | "uploading"
  | "confirming"
  | "success"
  | "error";

export interface UploadState {
  status: UploadStatus;
  progress: number; // 0–100
  errorMessage: string | null;
}

// Accepted image MIME types (client-side validation)
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
