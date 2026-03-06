"use client";

import { useState } from "react";
import { Alert, Button, Form, Input } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api/auth";
import { formatApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { userFromToken } from "@/lib/utils/jwt";
import type { RegisterRequest } from "@/lib/types/api";

interface RegisterFormValues {
  email: string;
  name: string;
  password: string;
}

export default function RegisterForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: RegisterFormValues) => {
    setError(null);
    setLoading(true);
    try {
      const tokens = await register(values as RegisterRequest);
      login(tokens, userFromToken(tokens.accessToken));
      router.replace("/feed");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
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
          { max: 254, message: "Email must be 254 characters or fewer" },
        ]}
      >
        <Input placeholder="you@example.com" autoComplete="email" />
      </Form.Item>

      <Form.Item
        label="Name"
        name="name"
        rules={[
          { required: true, message: "Please enter your name" },
          { min: 1, max: 100, message: "Name must be 1–100 characters" },
        ]}
      >
        <Input placeholder="Jane Doe" autoComplete="name" />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[
          { required: true, message: "Please enter a password" },
          { min: 8, message: "Password must be at least 8 characters" },
        ]}
      >
        <Input.Password placeholder="At least 8 characters" autoComplete="new-password" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Create account
        </Button>
      </Form.Item>

      <div className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </div>
    </Form>
  );
}
