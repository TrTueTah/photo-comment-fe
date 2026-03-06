"use client";

import { useState } from "react";
import { Button, Dropdown, Layout, Typography } from "antd";
import type { MenuProps } from "antd";
import { MoonOutlined, SunOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useTheme } from "@/lib/theme/context";

const { Header } = Layout;
const { Title } = Typography;

interface AppNavProps {
  onUploadClick?: () => void;
}

export default function AppNav({ onUploadClick }: AppNavProps) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.replace("/login");
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: (
        <div className="py-1">
          <div className="font-medium">{user?.name || "Account"}</div>
          {user?.email && (
            <div className="text-xs opacity-50">{user.email}</div>
          )}
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "logout",
      label: loggingOut ? "Signing out…" : "Sign out",
      onClick: handleLogout,
      disabled: loggingOut,
    },
  ];

  return (
    <Header className="flex items-center justify-between px-6 shadow-sm">
      <Title level={4} className="!mb-0">
        Photo Comment
      </Title>
      <div className="flex items-center gap-3">
        {onUploadClick && (
          <Button type="primary" onClick={onUploadClick}>
            Upload Photo
          </Button>
        )}
        <Button
          icon={isDark ? <SunOutlined /> : <MoonOutlined />}
          type="text"
          onClick={toggle}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        />
        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Button icon={<UserOutlined />} type="text">
            {user?.name || "Account"}
          </Button>
        </Dropdown>
      </div>
    </Header>
  );
}
