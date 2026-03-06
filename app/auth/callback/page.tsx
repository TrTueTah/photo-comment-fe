"use client";

import { useEffect } from "react";
import { Spin } from "antd";

export default function AuthCallbackPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    if (window.opener) {
      if (accessToken && refreshToken) {
        window.opener.postMessage(
          { type: "GOOGLE_AUTH_SUCCESS", accessToken, refreshToken },
          window.location.origin
        );
      } else {
        window.opener.postMessage(
          { type: "GOOGLE_AUTH_ERROR", message: "Google sign-in failed. Please try again." },
          window.location.origin
        );
      }
      window.close();
    } else {
      // Fallback: no opener (e.g. redirect flow) — just go to feed
      window.location.replace("/feed");
    }
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
