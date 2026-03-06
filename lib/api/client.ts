import type { ApiError, RefreshRequest, TokenPair } from "@/lib/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── Token store (module-level, client-side only) ────────────────────────────

let _accessToken: string | null = null;
let _refreshToken: string | null = null;
let _sessionExpiredHandler: (() => void) | null = null;

export function setTokens(accessToken: string, refreshToken: string): void {
  _accessToken = accessToken;
  _refreshToken = refreshToken;
  if (typeof window !== "undefined") {
    localStorage.setItem("refreshToken", refreshToken);
  }
}

export function clearTokens(): void {
  _accessToken = null;
  _refreshToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("refreshToken");
  }
}

export function setSessionExpiredHandler(handler: () => void): void {
  _sessionExpiredHandler = handler;
}

// ─── Refresh coordination ─────────────────────────────────────────────────────

let _isRefreshing = false;
let _pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  _pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  _pendingQueue = [];
}

async function attemptRefresh(): Promise<string> {
  const storedRefresh =
    _refreshToken ??
    (typeof window !== "undefined"
      ? localStorage.getItem("refreshToken")
      : null);

  if (!storedRefresh) {
    throw new Error("No refresh token available");
  }

  const body: RefreshRequest = { refreshToken: storedRefresh };
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  const tokens: TokenPair = await res.json();
  setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens.accessToken;
}

// ─── Error helpers ────────────────────────────────────────────────────────────

async function parseError(res: Response): Promise<ApiError> {
  try {
    return (await res.json()) as ApiError;
  } catch {
    return {
      statusCode: res.status,
      message: res.statusText || "Request failed",
      error: res.statusText,
    };
  }
}

export function formatApiError(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as ApiError;
    if (Array.isArray(e.message)) {
      return e.message.join(", ");
    }
    if (typeof e.message === "string" && e.message) {
      return e.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}

// ─── Public fetch (no auth) ───────────────────────────────────────────────────

export async function publicFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Authenticated fetch (with token refresh) ─────────────────────────────────

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = _accessToken;

  const doRequest = async (accessToken: string | null) => {
    return fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options?.headers ?? {}),
      },
    });
  };

  let res = await doRequest(token);

  if (res.status === 401) {
    if (_isRefreshing) {
      // Queue this request until the ongoing refresh completes
      const newToken = await new Promise<string>((resolve, reject) => {
        _pendingQueue.push({ resolve, reject });
      });
      res = await doRequest(newToken);
    } else {
      _isRefreshing = true;
      try {
        const newToken = await attemptRefresh();
        processQueue(null, newToken);
        res = await doRequest(newToken);
      } catch (err) {
        processQueue(err, null);
        clearTokens();
        _sessionExpiredHandler?.();
        throw err;
      } finally {
        _isRefreshing = false;
      }
    }
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
