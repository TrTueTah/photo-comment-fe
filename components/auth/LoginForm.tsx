"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Divider, Form, Input } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getGoogleAuthUrl, login } from "@/lib/api/auth";
import { formatApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { userFromToken } from "@/lib/utils/jwt";
import type { LoginRequest, TokenPair } from "@/lib/types/api";

interface LoginFormValues {
  email: string;
  password: string;
}

interface GoogleAuthMessage {
  type: "GOOGLE_AUTH_SUCCESS" | "GOOGLE_AUTH_ERROR";
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

export default function LoginForm() {
  const { login: authLogin } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const popupRef = useRef<Window | null>(null);

  // Listen for Google OAuth popup callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent<GoogleAuthMessage>) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
        const { accessToken, refreshToken } = event.data;
        if (accessToken && refreshToken) {
          const tokens: TokenPair = { accessToken, refreshToken };
          authLogin(tokens, userFromToken(accessToken));
          router.replace("/feed");
        }
        setGoogleLoading(false);
      } else if (event.data?.type === "GOOGLE_AUTH_ERROR") {
        setError(event.data.message ?? "Google sign-in failed. Please try again.");
        setGoogleLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [authLogin, router]);

  const onFinish = async (values: LoginFormValues) => {
    setError(null);
    setLoading(true);
    try {
      const tokens = await login(values as LoginRequest);
      authLogin(tokens, userFromToken(tokens.accessToken));
      router.replace("/feed");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    setGoogleLoading(true);
    const url = getGoogleAuthUrl();
    popupRef.current = window.open(
      url,
      "google-auth",
      "width=500,height=600,left=200,top=100"
    );

    // Detect popup closed without completing auth
    const checkClosed = setInterval(() => {
      if (popupRef.current?.closed) {
        clearInterval(checkClosed);
        setGoogleLoading(false);
      }
    }, 500);
  };

  return (
    <Form
      layout="vertical"
      onFinish={onFinish}
      autoComplete="off"
      requiredMark={false}
    >
      {error && (
        <Form.Item>
          <Alert message={error} type="error" showIcon />
        </Form.Item>
      )}

      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Please enter your email" },
          { type: "email", message: "Please enter a valid email address" },
        ]}
      >
        <Input placeholder="you@example.com" autoComplete="email" />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please enter your password" }]}
      >
        <Input.Password placeholder="Your password" autoComplete="current-password" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Sign in
        </Button>
      </Form.Item>

      <Divider plain>or</Divider>

      <Button
        block
        onClick={handleGoogleLogin}
        loading={googleLoading}
        icon={
          <svg viewBox="0 0 24 24" width="16" height="16" className="inline-block">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        }
      >
        Sign in with Google
      </Button>

      <div className="mt-4 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          Register
        </Link>
      </div>
    </Form>
  );
}
