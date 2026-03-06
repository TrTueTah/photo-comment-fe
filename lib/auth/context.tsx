"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { TokenPair, UserRef } from "@/lib/types/api";
import type { AuthContextValue } from "@/lib/types/app";
import {
  clearTokens,
  setSessionExpiredHandler,
  setTokens,
} from "@/lib/api/client";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserRef | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((tokens: TokenPair, userRef: UserRef) => {
    setTokens(tokens.accessToken, tokens.refreshToken);
    setAccessToken(tokens.accessToken);
    setUser(userRef);
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(userRef));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await import("@/lib/api/auth").then((m) => m.logout());
    } catch {
      // Ignore — clear client state regardless
    }
    clearTokens();
    setAccessToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("refreshToken");
    }
  }, []);

  // Restore session from localStorage on mount — no API call.
  // The apiFetch interceptor will transparently refresh the access token
  // on the first 401 it encounters.
  useEffect(() => {
    const storedUser =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const storedRefresh =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;

    if (storedUser && storedRefresh) {
      try {
        setUser(JSON.parse(storedUser) as UserRef);
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
      }
    }

    setIsLoading(false);
  }, []);

  // Register session-expired handler (called by interceptor when refresh fails)
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setAccessToken(null);
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
      window.location.href = "/login";
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
