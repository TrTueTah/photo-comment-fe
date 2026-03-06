import type {
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  TokenPair,
} from "@/lib/types/api";
import { apiFetch, publicFetch } from "./client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function register(data: RegisterRequest): Promise<TokenPair> {
  return publicFetch<TokenPair>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginRequest): Promise<TokenPair> {
  return publicFetch<TokenPair>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function refreshTokens(data: RefreshRequest): Promise<TokenPair> {
  return publicFetch<TokenPair>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function logout(): Promise<void> {
  await apiFetch<void>("/auth/logout", { method: "POST" });
}

export function getGoogleAuthUrl(): string {
  return `${BASE_URL}/auth/google`;
}
