import { Card } from "antd";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-md">
        <h1 className="mb-6 text-center text-2xl font-semibold">
          Create your account
        </h1>
        <RegisterForm />
      </Card>
    </div>
  );
}
