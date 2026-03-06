"use client";

import { useEffect } from "react";
import { Spin } from "antd";

const STORAGE_KEY = "google_auth_callback";

export default function AuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    const payload =
      accessToken && refreshToken
        ? { type: "success" as const, accessToken, refreshToken, ts: Date.now() }
        : { type: "error" as const, message: "Google sign-in failed. Please try again.", ts: Date.now() };

    // Primary channel: localStorage storage event — works even when
    // window.opener is null due to Cross-Origin-Opener-Policy headers.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

    // Secondary channel: postMessage for browsers that still expose opener.
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          payload.type === "success"
            ? { type: "GOOGLE_AUTH_SUCCESS", accessToken: payload.accessToken, refreshToken: payload.refreshToken }
            : { type: "GOOGLE_AUTH_ERROR", message: payload.message },
          window.location.origin
        );
      }
    } catch {
      // opener blocked or cross-origin — storage event handles it
    }

    window.close();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Spin size="large" />
        <p className="mt-4 text-gray-500">Completing sign-in…</p>
      </div>
    </div>
  );
}
