"use client";

import { useEffect } from "react";
import { Spin } from "antd";

export default function GoogleCallbackPage() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.opener) return;

    // The backend redirects here after OAuth and returns JSON with tokens.
    // We need to fetch the current page's response — it's already the current
    // URL loaded by the browser. The tokens are in the document body as JSON.
    const body = document.body.innerText.trim();
    try {
      const data = JSON.parse(body) as {
        accessToken?: string;
        refreshToken?: string;
      };
      if (data.accessToken && data.refreshToken) {
        window.opener.postMessage(
          {
            type: "GOOGLE_AUTH_SUCCESS",
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          },
          window.location.origin
        );
      } else {
        window.opener.postMessage(
          {
            type: "GOOGLE_AUTH_ERROR",
            message: "Google sign-in failed. Please try again.",
          },
          window.location.origin
        );
      }
    } catch {
      window.opener.postMessage(
        {
          type: "GOOGLE_AUTH_ERROR",
          message: "Google sign-in failed. Please try again.",
        },
        window.location.origin
      );
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
