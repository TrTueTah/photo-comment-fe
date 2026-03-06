import { Card } from "antd";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-md">
        <h1 className="mb-6 text-center text-2xl font-semibold">
          Sign in to Photo Comment
        </h1>
        <LoginForm />
      </Card>
    </div>
  );
}
